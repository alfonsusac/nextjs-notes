import CodeSnippet from "@/components/code-snippet/client"
import DynamicRouteTurnedStaticCode from "./code.mdx"
import DynamicRouteTurnedStaticBuildLog from "./buildlog.mdx"

export default function Page() {
  return <>
    <CodeSnippet
      title="app/books/[bookID]/page.js"
      code={ <DynamicRouteTurnedStaticCode /> }
    />
    <CodeSnippet
      title="Build logs"
      code={ <DynamicRouteTurnedStaticBuildLog /> }
      defaultClosed
    />
  </>
}