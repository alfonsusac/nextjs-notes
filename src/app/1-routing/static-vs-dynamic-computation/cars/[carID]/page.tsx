import Link from "next/link"

import CodeSnippet from "@/components/code-snippet"
import { ClientSideParams } from "./client"

export default function Page(p: { params: any }) {
  return <div className="p-4 border border-zinc-800 rounded-lg">
    <h1 className="text-xl py-2">
      <ClientSideParams />
    </h1>
    <p>This is a static route</p>
  </div>
}

export const dynamic = 'force-static'