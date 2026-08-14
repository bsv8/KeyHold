import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useSdkPreference} from '../hooks/useSdkPreference';

export default function Home(): React.JSX.Element {
  const {i18n} = useDocusaurusContext();
  const zh = i18n.currentLocale === 'zh-CN';
  const [sdk, setSdk] = useSdkPreference();
  const href = (path: string) => path;
  return <Layout>
    <main className="home">
      <section className="hero-poster">
        <div className="hero-grid" aria-hidden="true"><div className="hero-orbit orbit-a"/><div className="hero-orbit orbit-b"/><div className="hero-orbit orbit-c"/><div className="hero-document"><span>format</span><b>keymaster</b><span>version</span><b>2</b><span>cipher</span><b>aes-gcm</b><i/></div></div>
        <div className="hero-copy"><p className="eyebrow">KEYHOLD / KEYMASTER V2</p><h1>KeyHold</h1><p className="hero-lede">{zh ? '一个文档格式。两套 SDK。从密钥到密文，路径清晰。' : 'One document format. Two SDKs. A clear path from key to ciphertext.'}</p><div className="hero-actions"><Link className="button button--primary" to={href('/guide/getting-started')}>{zh ? '开始使用' : 'Get started'}</Link><Link className="text-link" to={href('/operations')}>{zh ? '查看 SDK 功能总览 →' : 'Explore the SDK operation map →'}</Link></div></div>
        <div className="hero-foot"><span>SECURE BY DESIGN</span><span>TS / GO</span><span>JSON INTEROPERABLE</span></div>
      </section>
      <section className="home-section protocol-section"><div className="section-kicker">01 / SHARED PROTOCOL</div><div><h2>{zh ? '协议是共同基础。' : 'The protocol is the shared ground.'}</h2><p>{zh ? 'KeyHold 将一个 secp256k1 私钥封装进可验证、可互操作的 JSON 文档。两套 SDK 共享同一格式与密码学边界。' : 'KeyHold wraps one secp256k1 private key in a verifiable, interoperable JSON document. Both SDKs share the same format and cryptographic boundaries.'}</p><Link className="text-link" to={href('/concepts/document-format')}>{zh ? '阅读文档格式 →' : 'Read the document format →'}</Link></div></section>
      <section className="home-section workflow-section"><div className="section-kicker">02 / TWO SDK WORKFLOWS</div><div><h2>{zh ? '选择 SDK，保持契约。' : 'Choose an SDK. Keep the contract.'}</h2><p>{zh ? '指南按能力组织；代码示例尊重 TypeScript 与 Go 各自的调用习惯，而不是隐藏差异。' : 'Guides are organized by capability. Examples respect each language’s calling conventions instead of hiding the differences.'}</p><div className="sdk-toggle" role="tablist" aria-label="SDK"><button type="button" role="tab" aria-selected={sdk === 'typescript'} className={sdk === 'typescript' ? 'sdk-toggle__active' : ''} onClick={() => setSdk('typescript')}>TypeScript</button><button type="button" role="tab" aria-selected={sdk === 'go'} className={sdk === 'go' ? 'sdk-toggle__active' : ''} onClick={() => setSdk('go')}>Go</button></div><pre><code>{sdk === 'typescript' ? `const document = await exportPrivateKey(input);\nconst unlocked = await unlockDocument(document, password);` : `document, err := keyhold.ExportPrivateKey(input)\nunlocked, err := keyhold.Unlock(document, password)`}</code></pre><Link className="text-link" to={href('/guide/getting-started')}>{zh ? '进入双 SDK 指南 →' : 'Open the two-SDK guide →'}</Link></div></section>
      <section className="home-section map-section"><div className="section-kicker">03 / OPERATION MAP</div><div><h2>{zh ? '从输入到输出，找到下一步。' : 'From input to output, find the next move.'}</h2><p>{zh ? '按能力分类的总览连接真实函数、参数、输出和 API 参考。' : 'A capability-led index connects real functions, parameters, outputs, and API references.'}</p><Link className="button button--outline" to={href('/operations')}>{zh ? '打开功能总览' : 'Open operation map'}</Link></div></section>
      <section className="home-cta"><p className="eyebrow">KEYHOLD / READY WHEN YOU ARE</p><h2>{zh ? '让密钥保持可验证。' : 'Keep keys verifiable.'}</h2><Link className="text-link" to={href('/guide/getting-started')}>{zh ? '开始构建 →' : 'Start building →'}</Link></section>
    </main>
  </Layout>;
}
