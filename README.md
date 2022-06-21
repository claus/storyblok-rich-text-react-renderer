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
React elements, and provides options to map any Storyblok rich text
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
    blokResolvers: { ... }, // embedded components
    defaultBlokResolver: (name, props) => ( ... ),
    defaultStringResolver: (str) => ( ... ),
    textResolver: (text) => ( ... ),
});
```

Sensible [default resolvers](#defaults) for marks and nodes are provided
out of the box. You only have to provide custom ones if you want to
override the default behavior.

If you use embedded Storyblok components, you have to provide
[blok resolvers](#blok-resolvers) to map them to your React components though,
otherwise they are ignored. You can also provide a
[default blok resolver](#default-blok-resolver) if you need a catch-all
solution.

### Mark resolvers

Mark resolvers are used to map inline elements.

Use the `markResolvers` option to add mark resolvers.

Supported element types and their resolver function signatures are:

- MARK_BOLD — `(children) => { ... }`
- MARK_ITALIC — `(children) => { ... }`
- MARK_STRIKE — `(children) => { ... }`
- MARK_UNDERLINE — `(children) => { ... }`
- MARK_CODE — `(children) => { ... }`
- MARK_STYLED — `(children, { class }) => { ... }`
- MARK_LINK — `(children, { linktype, href, target, anchor, uuid }) => { ... }`

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
            const { linktype, href, target } = props;
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

- NODE_HEADING — `(children, { level }) => { ... }`
- NODE_CODEBLOCK — `(children, { class }) => { ... }`
- NODE_IMAGE — `(children, { src, alt, title }) => { ... }`
- NODE_PARAGRAPH — `(children) => { ... }`
- NODE_QUOTE — `(children) => { ... }`
- NODE_OL — `(children) => { ... }`
- NODE_UL — `(children) => { ... }`
- NODE_LI — `(children) => { ... }`
- NODE_HR — `() => { ... }`
- NODE_BR — `() => { ... }`

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

### Default blok resolver

Use the `defaultBlokResolver` option to add a default blok resolver. The function signature is `(name, props) => { ... }`, where `name` is the Storyblok component's "technical" name and `props` is an object that contains all the component's fields, as well as its `_uid` and `_editable` values.

#### Example:

```js
import { render } from 'storyblok-rich-text-react-renderer';

render(document, {
    defaultBlokResolver: (name, props) => (
        <div>
            <code>Missing blok resolver for blok type "{name}".</code>
            <pre><code>{JSON.stringify(props, undefined, 2)}</code></pre>
        </div>
    )
});
```

### Default string resolver

Storyblok might return a simple string instead of a document object for rich text fields with trivial content. By default, the render function returns this string as-is. Use the `defaultStringResolver` option to customize this behavior. The function signature is `(str) => { ... }`.

#### Example:

```js
import { render } from 'storyblok-rich-text-react-renderer';

render(document, {
    defaultStringResolver: (str) => <p>{str}</p>
});
```

### Text resolver

Use the `textResolver` option to add a resolver for plain text nodes. The function signature is `(text) => { ... }`.

#### Example:

```js
import { render } from 'storyblok-rich-text-react-renderer';
import entities from 'entities';

render(document, {
    textResolver: (text) => entities.decodeHTML(text)
});
```

## Defaults

Default mark resolvers:

- MARK_BOLD — `<b> ... </b>`
- MARK_ITALIC — `<i> ... </i>`
- MARK_STRIKE — `<s> ... </s>`
- MARK_UNDERLINE — `<u> ... </u>`
- MARK_CODE — `<code> ... </code>`
- MARK_STYLED — `<span className> ... </span>`
- MARK_LINK — `<a href target> ... </a>`

Default node resolvers:

- NODE_HEADING — `<h1> ... </h1>` to `<h6> ... </h6>`
- NODE_CODEBLOCK — `<pre><code className> ... </code></pre>`
- NODE_IMAGE — `<img src alt title />`
- NODE_PARAGRAPH — `<p> ... </p>`
- NODE_QUOTE — `<blockquote> ... </blockquote>`
- NODE_OL — `<ol> ... </ol>`
- NODE_UL — `<ul> ... </ul>`
- NODE_LI — `<li> ... </li>`
- NODE_HR — `<hr />`
- NODE_BR — `<br />`

## Changelog

- 1.0.0 — Initial release
- 1.1.0 — Add MARK_STYLED mark resolver
- 1.2.0 — Add defaultBlockResolver
- 2.0.0 — Rename defaultBlockResolver (typo) to defaultBlokResolver (⚠️ Breaking change ⚠️)
- 2.1.0 — Allow React 17 as peer
- 2.1.1 — Allow block elements as children of inline elements (in particular linked images)
- 2.2.0 — Bugfix: Code was still referring to defaultBlockResolver (see 2.0.0)
- 2.3.0 — Add defaultStringResolver, allow plain string as input
- 2.4.0 — Add TypeScript type definitions (index.d.ts)
- 2.5.0 — Add textResolver
