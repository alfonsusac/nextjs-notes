import { BlockObjectResponse, ListBlockChildrenParameters, ListBlockChildrenResponse, PartialBlockObjectResponse } from "@notionhq/client/build/src/api-endpoints"
import { NotionASTNode } from "./node"
import { notion } from "../../../lib/notion"
import { unstable_cache } from "next/cache"
import { Audit } from "@/components/timer"

export type BlockType = BlockObjectResponse['type']
export type MapToAST = (newNode: NotionASTNode, currentNode: NotionASTNode) => void
export type MapToASTFnMap = { [key in BlockType]?: MapToAST }

export async function convertChildrenToAST(
  data: ListBlockChildrenResponse,
  options?: {
    fetchChildrenFn: (id: string) => Promise<ListBlockChildrenResponse>,
    ASTCallbackMap: MapToASTFnMap
  }
) {


  // Get function that would be called to fetch children
  const fetchChildrenFn = options?.fetchChildrenFn
    ?? unstable_cache(async (id) => {
      return await notion.blocks.children.list({ block_id: id })
    })
  
  // Define Default Mapping Behavior
  const defaultMapToASTFnMap: MapToASTFnMap = {
    'bulleted_list_item': GroupListTogether,
    'numbered_list_item': GroupListTogether,
    'to_do': GroupListTogether
  }

  // Assign default mapping behavior and override from custom maps
  const mapToASTFnMap: MapToASTFnMap = options?.ASTCallbackMap
    ? { ...defaultMapToASTFnMap, ...options.ASTCallbackMap } : defaultMapToASTFnMap


  const root = new NotionASTNode()
  await mapBlockListToAST(data.results, root, fetchChildrenFn, mapToASTFnMap)


  return root
}





async function mapBlockListToAST(
  list: ListBlockChildrenResponse['results'],
  currentNode: NotionASTNode,
  fetchChildrenFn: (id: string) => Promise<ListBlockChildrenResponse>,
  ASTCallbackMap: MapToASTFnMap
) {
  await Promise.allSettled(list.map(async unknownblock => {

    // Convert Notion Blocks into Notion AST Node
    const block = validateBlock(unknownblock)
    const newNode = new NotionASTNode(validateBlock(unknownblock))

    // Map the node in to the AST
    const mapToAST = getMapToASTFunction(ASTCallbackMap, block.type)
    mapToAST(newNode, currentNode)

    // Explore Children
    if (block.has_children === true) {
      const children = await fetchChildrenFn(block.id)
      await mapBlockListToAST(children.results, newNode, fetchChildrenFn, ASTCallbackMap)
    }

  }))
}

function validateBlock(unknownblock: PartialBlockObjectResponse | BlockObjectResponse) {
  if (
    'type' in unknownblock === false
    || unknownblock.object !== 'block'
  ) {
    console.log("Unknown object type: " + unknownblock)
    throw "Partial/Invalid Block"
  }
  return unknownblock as BlockObjectResponse
}

// Finds function in the Map, uses default if not found.
function getMapToASTFunction(ASTCallbackMap: MapToASTFnMap, type: BlockType) {
  return ASTCallbackMap[type] ?? ((newNode, currentNode) => {
    currentNode.pushChild(newNode)
  })
}

const GroupListTogether: MapToAST = (newNode, currentNode) => {

  const lastChildNode = currentNode.children.at(-1)
  const listType = newNode.type

  // If Last Child is The Same Type, 
  if (lastChildNode?.type === listType) {
    
    // then append 'list_item' to last child (should be a group_node)
    lastChildNode.pushChild(newNode)

  // If Last Child is Not same Type.
  } else {

    // then create a new "Group Node",
    //  append group node to current node children
    //  add 'list_item' to group node
    const newListGroupNode = new NotionASTNode()

    newListGroupNode.type = listType
    newListGroupNode.is_group = true

    newListGroupNode.pushChild(newNode)
    currentNode.pushChild(newListGroupNode)

  }
  newNode.type = 'list_item'
}