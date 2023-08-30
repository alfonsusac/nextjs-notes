import { cache } from "react"
import { notion } from "./init"
import { NumberPropertyItemObjectResponse, PageObjectResponse, RichTextItemResponse, RichTextPropertyItemObjectResponse } from "@notionhq/client/build/src/api-endpoints"
import { flattenRichText } from "../rsc/rich-text"
import { slug as slugify } from "github-slugger"

const ARTICLE_DATABASE_ID = '3a6b7f9f0fed440e924494b2c64dc10d'




function transformPageData(result: PageObjectResponse) {
  const { parent, ...page } = result as PageObjectResponse
  const nameProp = page.properties.Name as {
    type: "title"
    title: Array<RichTextItemResponse>
    id: string
  }
  const slugProp = page.properties.slug as {
    type: "rich_text"
    rich_text: Array<RichTextItemResponse>
    id: string
  }
  const viewsProp = page.properties.Views as NumberPropertyItemObjectResponse
  const rawTitle = flattenRichText(nameProp.title)
  return {
    ...page,
    title: nameProp.title,
    flattenedTitle: rawTitle,
    slug: flattenRichText(slugProp.rich_text),
    views: viewsProp.number ?? 0
  }
}




export const getArticleList = cache(
  async () => {
    const response = await notion.databases.query({
      database_id: ARTICLE_DATABASE_ID,
      filter: {
        and: [
          { property: 'Published', checkbox: { equals: true } },
          { property: 'slug', rich_text: { is_not_empty: true } }
        ]
      }
    })
    return response.results.map(
      result => {
        return transformPageData(result as PageObjectResponse)
      }
    )

  }
)


export const getArticle = cache(
  async (slug: string) => {
    // Search using slug
    const response = await notion.databases.query({
      database_id: ARTICLE_DATABASE_ID,
      filter: {
        property: "slug",
        rich_text: { equals: slug }
      }
    })
    // Update if no slug
    // if (response.results.length === 0) {

    //   const articles = await getArticleList()
    //   const article = articles.find(r => r.slug === slug)
    //   if (!article) return undefined
    //   await updateSlug(article.id, slug)
    //   return article

    // }
    return transformPageData(response.results[0] as PageObjectResponse)
  }
)

// async function updateSlug(id: string, slug: string) {
//   return await notion.pages.update({
//     page_id: id,
//     properties: {
//       'slug': {
//         rich_text: [
//           {
//             type: 'text',
//             text: { content: slug }
//           }
//         ]
//       }
//     }
//   })
// }