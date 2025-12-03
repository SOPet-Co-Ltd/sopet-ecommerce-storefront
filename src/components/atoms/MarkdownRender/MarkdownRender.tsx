import {
  MDXComponents,
  MDXRemote,
  MDXRemoteProps,
} from "next-mdx-remote-client/rsc"

const components: MDXComponents = {
  p: (props) => (
    <p
      className="mb-4 last:mb-0 sop-body-md-regular text-sop-neutral-gray-300"
      {...props}
    />
  ),
  ul: (props) => (
    <ul
      className="list-disc pl-4 list-outside mb-4 last:mb-0 sop-body-md-regular text-sop-neutral-gray-300"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="list-decimal pl-4 list-outside mb-4 last:mb-0 sop-body-md-regular text-sop-neutral-gray-300"
      {...props}
    />
  ),
  li: (props) => (
    <li
      className="mb-2 sop-body-md-regular text-sop-neutral-gray-300"
      {...props}
    />
  ),
  h1: (props) => (
    <h2
      className="sop-headline-sm-medium text-sop-primary-700 mb-4 mt-8"
      {...props}
    />
  ),
  h2: (props) => (
    <h2
      className="sop-headline-sm-medium text-sop-primary-700 mb-4 mt-8"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="sop-headline-xs-medium text-sop-primary-700 mb-4 mt-6"
      {...props}
    />
  ),
  strong: (props) => (
    <strong className="font-semibold text-sop-primary-600" {...props} />
  ),
  blockquote: (props) => (
    <blockquote
      className="border-l-4 border-sop-primary-500 pl-4 italic sop-body-md-regular text-sop-neutral-gray-300 my-4"
      {...props}
    />
  ),
  img: (props) => <img className="my-4 mx-auto" {...props} />,
}

export const MarkdownRender = (
  props: Pick<MDXRemoteProps, "source" | "onError">
) => {
  return <MDXRemote {...props} components={components} />
}
