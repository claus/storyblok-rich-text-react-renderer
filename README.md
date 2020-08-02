# Storyblok Rich Text Renderer for React

[![npm](https://img.shields.io/npm/v/storyblok-rich-text-react-renderer?style=flat-square)](https://www.npmjs.com/package/storyblok-rich-text-react-renderer)
[![GitHub](https://img.shields.io/github/license/claus/storyblok-rich-text-react-renderer?style=flat-square)](https://github.com/claus/storyblok-rich-text-react-renderer/blob/master/LICENSE)


Renders Storyblok rich text content to React elements.

## Motivation

Storyblok provides a renderer for its rich text field type via their
`storyblok-js-client` package. This renderer outputs HTML markup,
which can be used in React via the `dangerouslySetInnerHTML` property:

```js
import StoryblokClient from 'storyblok-js-client';

const Storyblok = new StoryblokClient({ accessToken: 'YOUR_TOKEN' });

function RichText({ document }) {
    const html = Storyblok.richTextResolver.render(document);
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

Apart from being a bit awkward (`dangerouslySetInnerHTML` is, as the name
implies, dangerous), this is problematic because it is not possible to map
rich text elements to React components, e.g.:

1. Embedded Storyblok components
2. Links that you might want to pass through your app's router

Instead of HTML markup, `storyblok-rich-text-react-renderer` outputs
React elements, and provides options to map any Stoyblok rich text
element to custom React components.

## Installation

```
npm install storyblok-rich-text-react-renderer
```

## Usage

```js
import { render } from 'storyblok-rich-text-react-renderer';

function RichText({ document }) {
    // document is the rich text object you receive from Storyblok,
    // in the form { type: "doc", content: [ ... ] }
    return <div>{render(document)}</div>;
}
```

## Advanced usage

To map rich text elements to custom React components, resolvers can be passed
via the optional second argument of the `render` function:

```js
render(document, {
    markResolvers: { ... }, // inline elements
    nodeResolvers: { ... }, // block elements
    blokResolvers: { ... } // embedded components
});
```

### Mark resolvers

Mark resolvers are used to map inline elements.

Use the `markResolvers` option to add mark resolvers.

Supported element types and their resolver function signatures are:

- MARK_BOLD - `(children) => { ... }`
- MARK_ITALIC - `(children) => { ... }`
- MARK_STRIKE - `(children) => { ... }`
- MARK_UNDERLINE - `(children) => { ... }`
- MARK_CODE - `(children) => { ... }`
- MARK_LINK - `(children, { href, target, linktype }) => { ... }`

#### Example: Map bold elements to `<strong>`

```js
import { render, MARK_BOLD } from 'storyblok-rich-text-react-renderer';

render(document, {
    markResolvers: {
        [MARK_BOLD]: (children) => <strong>{children}</strong>
    }
});
```

#### Example: Map link elements to Next.js' `<Link>` component

```js
import Link from 'next/link';
import { render, MARK_LINK } from 'storyblok-rich-text-react-renderer';

render(document, {
    markResolvers: {
        [MARK_LINK]: (children, props) => {
            const { href, target, linktype } = props;
            if (linktype === 'email') {
                // Email links: add `mailto:` scheme and map to <a>
                return <a href={`mailto:${href}`}>{children}</a>;
            }
            if (href.match(/^(https?:)?\/\//)) {
                // External links: map to <a>
                return <a href={href} target={target}>{children}</a>;
            }
            // Internal links: map to <Link>
            return <Link href={href}><a>{children}</a></Link>;
        }
    }
});
```

### Node resolvers

Node resolvers are used to map block elements.

Use the `nodeResolvers` option to add node resolvers.

Supported element types and their resolver function signatures are:

- NODE_HEADING - `(children, { level }) => { ... }`
- NODE_CODEBLOCK - `(children, { class }) => { ... }`
- NODE_IMAGE - `(children, { src, alt, title }) => { ... }`
- NODE_PARAGRAPH - `(children) => { ... }`
- NODE_QUOTE - `(children) => { ... }`
- NODE_OL - `(children) => { ... }`
- NODE_UL - `(children) => { ... }`
- NODE_LI - `(children) => { ... }`
- NODE_HR - `() => { ... }`
- NODE_BR - `() => { ... }`

#### Example: Map image elements to custom React components

```js
import MyImage from 'components/MyImage';
import { render, NODE_IMAGE } from 'storyblok-rich-text-react-renderer';

render(document, {
    nodeResolvers: {
        [NODE_IMAGE]: (children, props) => <MyImage {...props} />
    }
});
```

### Blok resolvers

Blok resolvers are used to map embedded Storyblok components.

Use the `blokResolvers` option to add blok resolvers. Keys are the Storyblok component's "technical" name. The function signature is always `(props) => { ... }`, where `props` is an object that contains all the component's fields, as well as its `_uid` and `_editable` values.

#### Example: Map blok elements to custom React components

```js
import MyComponent from 'components/MyComponent';
import { render } from 'storyblok-rich-text-react-renderer';

render(document, {
    blokResolvers: {
        ['my_component']: (props) => <MyComponent {...props} />
    }
});
```
