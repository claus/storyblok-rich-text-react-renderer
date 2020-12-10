import React, { FunctionComponent, ReactNode } from 'react'

export const enum NODE_RESOLVERS {
  NODE_HEADING = 'heading',
  NODE_CODEBLOCK = 'code_block',
  NODE_PARAGRAPH = 'paragraph',
  NODE_QUOTE = 'blockquote',
  NODE_OL = 'ordered_list',
  NODE_UL = 'bullet_list',
  NODE_LI = 'list_item',
  NODE_HR = 'horizontal_rule',
  NODE_BR = 'hard_break',
  NODE_IMAGE = 'image'
}

export const enum MARK_RESOLVERS {
  MARK_BOLD = 'bold',
  MARK_ITALIC = 'italic',
  MARK_STRIKE = 'strike',
  MARK_UNDERLINE = 'underline',
  MARK_CODE = 'code',
  MARK_LINK = 'link',
  MARK_STYLED = 'styled'
}

type NodeResolverType = {
  [key in NODE_RESOLVERS]: (a?: ReactNode, b?: any) => ReactNode
}
type MarkResolverType = {
  [key in MARK_RESOLVERS]: (a?: ReactNode, b?: any) => ReactNode
}

type RenderOptionsProps = {
  blokResolvers?: {
    [k: string]: (props: any) => ReactNode
  }
  defaultBlokResolver?: (name: string, props: any) => ReactNode
  nodeResolvers?: Partial<NodeResolverType>
  markResolvers?: Partial<MarkResolverType>
}

export const render = (document: any, options: RenderOptionsProps): ReactNode | null => {
  if (
    typeof document === 'object' &&
    document.type === 'doc' &&
    Array.isArray(document.content)
  ) {
    const {
      blokResolvers = {},
      defaultBlokResolver = () => null,
      nodeResolvers: customNodeResolvers = {},
      markResolvers: customMarkResolvers = {}
    } = options ?? {}

    const nodeResolvers: any = {
      ...defaultNodeResolvers,
      ...customNodeResolvers
    }

    const markResolvers: any = {
      ...defaultMarkResolvers,
      ...customMarkResolvers
    }

    let currentKey = 0

    const addKey = (element: any) =>
      React.isValidElement(element)
        ? React.cloneElement(element, { key: currentKey++ })
        : element

    const renderNodes = (nodes: any) => {
      const elements = nodes
        ? nodes.map(renderNode).filter((node: any) => node != null)
        : null
      return Array.isArray(elements) && elements.length === 0
        ? null
        : elements
    }

    const renderNode = (node: any) => {
      if (node.type === 'blok') {
        const { body } = node.attrs
        return body.map(({ component, ...props }: any) => {
          const resolver = blokResolvers[component]
          const element = resolver
            ? resolver(props)
            : defaultBlokResolver(component, props)
          return addKey(element)
        })
      } else if (node.type === 'text') {
        const marks = node.marks ?? []
        return marks.reduceRight((children: any, mark: any) => {
          const resolver = markResolvers[mark.type as string]
          return resolver
            ? addKey(resolver(children, mark.attrs))
            : children
        }, node.text)
      } else {
        const resolver = nodeResolvers[node.type]
        return resolver
          ? addKey(resolver(renderNodes(node.content), node.attrs))
          : null
      }
    }

    return renderNodes(document.content)
  }
  return null
}

const simpleNodeResolver = (element: string | FunctionComponent) => (children: React.ReactNode) =>
  children != null ? React.createElement(element, null, children) : null

const emptyNodeResolver = (element: string | FunctionComponent) => () =>
  React.createElement(element)

const headingNodeResolver = (children: React.ReactNode, props: any) =>
  React.createElement(`h${props.level}`, null, children)

const imageNodeResolver = (children: React.ReactNode, props: any) =>
  React.createElement('img', props, children)

const codeblockNodeResolver = (children: React.ReactNode, props: any) => {
  const codeProps = { className: props.class }
  const code = React.createElement('code', codeProps, children)
  return React.createElement('pre', null, code)
}

const simpleMarkResolver = (element: string | FunctionComponent) => (children: React.ReactNode) =>
  React.createElement(element, null, children)

const linkMarkResolver = (children: React.ReactNode, { href, target, linktype }: any) => {
  const props = {
    href: linktype === 'email' ? `mailto:${href}` : href,
    target
  }
  return React.createElement('a', props, children)
}

const styledMarkResolver = (children: React.ReactNode, props: any) =>
  React.createElement('span', { className: props.class }, children)

const defaultNodeResolvers: RenderOptionsProps['nodeResolvers'] = {
  [NODE_RESOLVERS.NODE_HEADING]: headingNodeResolver,
  [NODE_RESOLVERS.NODE_CODEBLOCK]: codeblockNodeResolver,
  [NODE_RESOLVERS.NODE_IMAGE]: imageNodeResolver,
  [NODE_RESOLVERS.NODE_PARAGRAPH]: simpleNodeResolver('p'),
  [NODE_RESOLVERS.NODE_QUOTE]: simpleNodeResolver('blockquote'),
  [NODE_RESOLVERS.NODE_OL]: simpleNodeResolver('ol'),
  [NODE_RESOLVERS.NODE_UL]: simpleNodeResolver('ul'),
  [NODE_RESOLVERS.NODE_LI]: simpleNodeResolver('li'),
  [NODE_RESOLVERS.NODE_HR]: emptyNodeResolver('hr'),
  [NODE_RESOLVERS.NODE_BR]: emptyNodeResolver('br')
}

const defaultMarkResolvers: RenderOptionsProps['markResolvers'] = {
  [MARK_RESOLVERS.MARK_LINK]: linkMarkResolver,
  [MARK_RESOLVERS.MARK_STYLED]: styledMarkResolver,
  [MARK_RESOLVERS.MARK_BOLD]: simpleMarkResolver('b'),
  [MARK_RESOLVERS.MARK_ITALIC]: simpleMarkResolver('i'),
  [MARK_RESOLVERS.MARK_STRIKE]: simpleMarkResolver('s'),
  [MARK_RESOLVERS.MARK_UNDERLINE]: simpleMarkResolver('u'),
  [MARK_RESOLVERS.MARK_CODE]: simpleMarkResolver('code')
}
