import React from 'react';

export const NODE_HEADING = 'heading';
export const NODE_CODEBLOCK = 'code_block';
export const NODE_PARAGRAPH = 'paragraph';
export const NODE_QUOTE = 'blockquote';
export const NODE_OL = 'ordered_list';
export const NODE_UL = 'bullet_list';
export const NODE_LI = 'list_item';
export const NODE_HR = 'horizontal_rule';
export const NODE_BR = 'hard_break';
export const NODE_IMAGE = 'image';
export const NODE_EMOJI = 'emoji';

export const MARK_BOLD = 'bold';
export const MARK_ITALIC = 'italic';
export const MARK_STRIKE = 'strike';
export const MARK_UNDERLINE = 'underline';
export const MARK_CODE = 'code';
export const MARK_LINK = 'link';
export const MARK_STYLED = 'styled';
export const MARK_SUBSCRIPT = 'subscript';
export const MARK_SUPERSCRIPT = 'superscript';
export const MARK_HIGHLIGHT = 'highlight';
export const MARK_TEXT_STYLE = 'textStyle';
export const MARK_ANCHOR = 'anchor';

export function render(document, options = {}) {
    if (
        typeof document === 'object' &&
        document.type === 'doc' &&
        Array.isArray(document.content)
    ) {
        const {
            blokResolvers = {},
            defaultBlokResolver = () => null,
            nodeResolvers: customNodeResolvers = {},
            markResolvers: customMarkResolvers = {},
            textResolver = str => str,
        } = options;

        const nodeResolvers = {
            ...defaultNodeResolvers,
            ...customNodeResolvers,
        };

        const markResolvers = {
            ...defaultMarkResolvers,
            ...customMarkResolvers,
        };

        let currentKey = 0;

        const addKey = element =>
            React.isValidElement(element)
                ? React.cloneElement(element, { key: currentKey++ })
                : element;

        const renderNodes = nodes => {
            const elements = nodes
                ? nodes.map(renderNode).filter(node => node != null)
                : null;
            return Array.isArray(elements) && elements.length === 0
                ? null
                : elements;
        };

        const renderNode = node => {
            if (node.type === 'blok') {
                const { body } = node.attrs;
                return body.map(({ component, ...props }) => {
                    const resolver = blokResolvers[component];
                    const element = resolver
                        ? resolver(props)
                        : defaultBlokResolver(component, props);
                    return addKey(element);
                });
            } else {
                let childNode;
                if (node.type === 'text') {
                    childNode = textResolver(node.text);
                } else {
                    const resolver = nodeResolvers[node.type];
                    childNode = resolver
                        ? addKey(resolver(renderNodes(node.content), node.attrs))
                        : null;
                }
                const marks = node.marks ?? [];
                return marks.reduceRight((children, mark) => {
                    const resolver = markResolvers[mark.type];
                    return resolver
                        ? addKey(resolver(children, mark.attrs))
                        : children;
                }, childNode);
            }
        };

        return renderNodes(document.content);
    } else if (typeof document === 'string') {
        const {
          defaultStringResolver = (str) => str,
          textResolver = (str) => str,
        } = options;
        return defaultStringResolver(textResolver(document));
    }
    return null;
}

const simpleNodeResolver = element => children =>
    children != null ? React.createElement(element, null, children) : null;

const emptyNodeResolver = element => () =>
    React.createElement(element);

const headingNodeResolver = (children, props) =>
    React.createElement(`h${props.level}`, null, children);

const imageNodeResolver = (children, props) =>
    React.createElement('img', props, children);

const codeblockNodeResolver = (children, props) => {
    const codeProps = { className: props.class };
    const code = React.createElement('code', codeProps, children);
    return React.createElement('pre', null, code);
};

const emojiNodeResolver = (_, attrs) => {
    if (!attrs) return null;
    const props = {
        'data-type': 'emoji',
        'data-name': attrs.name,
        emoji: attrs.emoji,
    }
    if (attrs.emoji || !attrs.fallbackImage) {
        return React.createElement('span', props, attrs.emoji);
    } else {
        const fallbackProps = {
            src: attrs.fallbackImage,
            draggable: 'false',
            loading: 'lazy',
            align: 'absmiddle',
            alt: attrs.name,
        };
        const fallback = React.createElement('img', fallbackProps);
        return React.createElement('span', props, fallback);
    }
};

const simpleMarkResolver = element => children =>
    React.createElement(element, null, children);

const linkMarkResolver = (children, attrs) => {
    const props = attrs ? {
        href: attrs.linktype === 'email' ? `mailto:${attrs.href}` : attrs.href,
        target: attrs.target,
    } : {};
    return React.createElement('a', props, children);
};

const styledMarkResolver = (children, attrs) => {
    const props = attrs ? { className: attrs.class } : {};
    return React.createElement('span', props, children);
}

const highlightMarkResolver = (children, attrs) => {
    const props = attrs ? { style: { backgroundColor: attrs.color } } : {};
    return React.createElement('span', props, children);
}

const textStyleMarkResolver = (children, attrs) => {
    const props = attrs ? { style: { color: attrs.color } } : {};
    return React.createElement('span', props, children);
}

const anchorMarkResolver = (children, attrs) => {
    const props = attrs ? { id: attrs.id } : {};
    return React.createElement('span', props, children);
}

const defaultNodeResolvers = {
    [NODE_HEADING]: headingNodeResolver,
    [NODE_CODEBLOCK]: codeblockNodeResolver,
    [NODE_IMAGE]: imageNodeResolver,
    [NODE_PARAGRAPH]: simpleNodeResolver('p'),
    [NODE_QUOTE]: simpleNodeResolver('blockquote'),
    [NODE_OL]: simpleNodeResolver('ol'),
    [NODE_UL]: simpleNodeResolver('ul'),
    [NODE_LI]: simpleNodeResolver('li'),
    [NODE_HR]: emptyNodeResolver('hr'),
    [NODE_BR]: emptyNodeResolver('br'),
    [NODE_EMOJI]: emojiNodeResolver,
};

const defaultMarkResolvers = {
    [MARK_LINK]: linkMarkResolver,
    [MARK_STYLED]: styledMarkResolver,
    [MARK_BOLD]: simpleMarkResolver('b'),
    [MARK_ITALIC]: simpleMarkResolver('i'),
    [MARK_STRIKE]: simpleMarkResolver('s'),
    [MARK_UNDERLINE]: simpleMarkResolver('u'),
    [MARK_CODE]: simpleMarkResolver('code'),
    [MARK_SUBSCRIPT]: simpleMarkResolver('sub'),
    [MARK_SUPERSCRIPT]: simpleMarkResolver('sup'),
    [MARK_HIGHLIGHT]: highlightMarkResolver,
    [MARK_TEXT_STYLE]: textStyleMarkResolver,
    [MARK_ANCHOR]: anchorMarkResolver,
};
