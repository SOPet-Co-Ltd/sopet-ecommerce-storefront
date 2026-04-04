import { MarkdownRender } from "@/components/atoms"

type PolicyMarkdownLayoutProps = {
  title: string
  source: string
}

export function PolicyMarkdownLayout({
  title,
  source,
}: PolicyMarkdownLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:py-12">
      <h1 className="sop-headline-md-medium text-sop-primary-700 mb-8">
        {title}
      </h1>
      <MarkdownRender source={source} />
    </div>
  )
}
