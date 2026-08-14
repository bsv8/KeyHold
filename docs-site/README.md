# KeyHold documentation site

This is the independently deployable KeyHold SDK documentation site. It reuses
the visual system from the reference Connect docs project, while the guides
and API reference describe the KeyHold TypeScript and Go SDKs.

~~~bash
npm ci
npm run dev
npm run build
npm run preview
~~~

The API reference is regenerated from ../typescript/src/index.ts before the
VitePress site starts or builds. Generated files under site/api/ and
site/.vitepress/dist/ are ignored.
