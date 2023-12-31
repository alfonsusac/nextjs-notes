import 'katex/dist/katex.min.css'
import { cn } from "@/components/typography"
import { Sidebar } from "@/app/demos/layout"
import { ToCSidebar } from "@/components/toc/client"
import { convertChildrenToAST } from "@/components/notion/parser/parser"
import { extractHeadings } from "@/components/notion/notion-toc/rsc"
import { CommentSection } from "@/components/giscus"
import { NotionIcon, NotionImage } from "@/components/notion/rsc/images"
import Link from "next/link"
import { NotionRichText } from "@/components/notion/rsc/rich-texts/parser"
import { formatDistanceToNow } from "date-fns"
import { InlineMentionTooltip } from "@/components/notion/client"
import { NotionPageViews } from "./client"
import { getArticle } from "@/components/notion/data/articles"
import { getPageContent } from "@/components/notion/data/helper"
import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import { Audit, audit, clearLog } from '@/components/timer'
import supabase from '@/lib/supabase'
import { getCachedPageDetails } from './data'

// ! Server action not working yet in static routes.
// export const dynamicParams = false
// export const dynamic = 'error'
// export async function generateStaticParams() {
//   const articles = await getArticleList()
//   const params = articles.map(({ slug }) => {
//     return { slug }
//   })
//   return params
// }

export async function generateMetadata({ params }: any) {
  const { article } = await getCachedPageDetails(params.slug)
  return {
    title: article.flattenedTitle,
    description: "Next.js Notes, Tips and Tricks - by @alfonsusac",
  }
}

export default async function Page({ params }: any) {

  clearLog()
  // Cached Data
  const a = new Audit("Generating Page")
  const { article, content } = await getCachedPageDetails(params.slug)
  // const tmp = await getCachedPageDetails(params.slug)
  // const tmp2 = await getCachedPageDetails(params.slug)
  // const tmp3 = await getCachedPageDetails(params.slug)
  a.mark('')

  const ast = await audit(
    'Convert ListBlock to AST',
    async () => await convertChildrenToAST(content),
  )
  const headings = await audit(
    'Extract Headings',
    async () => extractHeadings(ast),
  )

  // Dynamic Data
  const metadata = await audit(
    'Retrieve Page Metadata',
    async () => await getPageMetadata(article.id)
  )

  a.total()
  console.info("Done generating page!")
  console.info("Rendering Page...")

  return (
    <>
      <NotionImage
        alt="Page Cover"
        nprop={ article.cover as any }
        className={ cn(
          "w-full h-60 object-cover",
          "after:bg-gradient-to-t after:from-zinc-800 after:to-transparent",
          "absolute",
          "top-0 left-0 right-0 m-0",
          "max-w-none flex"
        ) }
        id={ article.id }
      />
      {
        article.cover ? <div className="h-40 w-0 flex-grow"></div> : null
      }
      <div className="flex gap-4 mx-auto">
        
        {/* LEFT */}
        <article className="max-w-article m-0 w-full mx-auto md:mr-0">
          <Header />
          {/* <NotionASTRenderer ast={ ast } /> */ }
          {/* <CommentSection /> */ }
          <footer className="mt-12 py-12 border-t border-t-zinc-600 text-zinc-500 text-sm space-y-2 leading-normal">
            <FooterContent />
          </footer>
        </article>

        {/* RIGHT */}
        <div className={ cn(
          'hidden md:block',
          'sticky top-20',
          'w-56 h-full',
          'mt-32',
        ) }>
          In this article
          <Sidebar>
            <li>
              <ToCSidebar
                startDepth={ 1 }
                depth={ 3 }
                className=""
                listClassName="text-sm"
                items={ headings }
              />
            </li>
          </Sidebar>
        </div>
      </div>
    </>
  )

  function Header() {
    return (
      <header className="my-8 mt-8 space-y-2 relative">
        <NotionIcon icon={ article.icon }
          className="text-5xl m-0 block w-12 h-12 mb-4"
        />
        <Link
          className="text-sm p-2 rounded-md text-zinc-400 hover:bg-zinc-900 decoration-zinc-600 underline-offset-4 -mx-2"
          href="/articles"
        >
          /articles
        </Link>
        <h1>
          <NotionRichText rich_text={ article.title } />
        </h1>
        <div className="text-sm text-zinc-500">
          Last updated:
          <InlineMentionTooltip
            content={
              (new Date(article.last_edited_time)).toLocaleString()
            }
          >
            <span className="ml-1 rounded-md p-1 hover:bg-zinc-900/80">
              { '@' + formatDistanceToNow(new Date(article.last_edited_time), { addSuffix: true }) }
            </span>
          </InlineMentionTooltip>
          { ` ● ` }
          <NotionPageViews
            id={ article.id }
            num={ metadata.views }
            loadView={
              async (id, prev) => {
                'use server'
                const res = await supabase
                  .from('Article')
                  .update({ views: prev + 1 })
                  .eq('id', id)
                  .select('views')
              }
            }
          />
        </div>
      </header>
    )
  }

  function FooterContent() {
    return (
      <>
        <p>
          The content on this website are purely written by Alfon to help people better understand how Next.js works and are not affiliated with Vercel (unofficial).
        </p>
        <p>
          If you have any comments for improvement on the website or the content feel free to visit <a href="https://github.com/alfonsusac/nextjs-demos/issues">the respository</a> which is 100% open source.
        </p>
        <p>
          Written by <a href="https://github.com/alfonsusac">@alfonsusac</a>
        </p>
      </>
    )
  }
}


// ❌ this doesn't work
export async function getPageDetails(slug: string) {

  const getCachedData = unstable_cache(
    async () => {
      console.log("CACHE MISS! GET PAGE DETAILS")
      const article = await getArticle(slug)
      const content = await getPageContent(article.id)
      return { article, content }
    },
    [slug],
    {
      tags: ['articles', slug],
    }
  )

  const getMemoizedData = cache(
    async () => {
      console.log("Is this getting logged? " + Math.random())
      return await getCachedData()
    }
  )

  return getMemoizedData()
}

// @ts-ignore
// export const getMemoizedPageDetails = cache(getPageDetails)



async function getPageMetadata(id: string) {

  const metadata = {
    views: 0
  }

  try {

    const res = await supabase
      .from('Article')
      .select('views')
      .eq('id', id)

    // console.log(res)

    const views = res.data?.[0]?.views

    if (!views) {
      await supabase
        .from('Article')
        .insert({ id, views: 0 })
    }

    if (views) {
      metadata.views = views
    }

  } catch (error) {
    console.log("Error getting views")
    console.error(error)
  }

  return metadata
}