import { NotionASTNode } from "../../parser/node"
import { NotionRichText } from "../rich-texts/parser"
import { NotionFigureCaption } from "../rich-texts/captions"

export function RichTextNode({ node }: { node: NotionASTNode }) {
  if('rich_text' in node.props)
    return <NotionRichText rich_text={ node.props.rich_text } />
  else 
    return <></>
}

export function CaptionNode({ node, ...props }:
  Omit<React.ComponentProps<typeof NotionFigureCaption>, 'caption'>
  & { node: NotionASTNode }
) {
  if('caption' in node.props)
    return <NotionFigureCaption caption={ node.props.caption } { ...props } />
  else 
    return <></>
}

