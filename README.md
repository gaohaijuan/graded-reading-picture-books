# 分级阅读绘本项目

本仓库汇总分级阅读绘本的项目代码、插画和人物素材、绘本文稿、校样、开发文档及审核资料。
这是当前工作文件的独立私有快照；各版本的审阅和完成状态以对应目录说明为准。

## 目录

- little-protagonist/：小程序、浏览器预览、后台、构建脚本、测试、原始美术资源与开发文档。
- output/：各级绘本文稿、插画、PDF/Word 校样、历史修订与字表核查。
- output/level3-full-review-v4-20261031/：第三级 15 篇完整复审修订稿及逐字核查。
- browser-test/：浏览器验收图与检查结果。
- tmp/：保留有价值的制作脚本和 PDF 校样；不包含下载的渲染运行库和临时服务数据。
- FILE-MANIFEST.json：逐文件 SHA-256、大小、LFS 标记及汇总。
- UPLOAD-EXCLUSIONS.json：未上传的依赖、缓存、凭据和运行数据记录。
- SOURCE-STATE.json：原项目版本与本次快照范围。

## 获取资源

插画、PDF、Office 文件、字体等由 Git LFS 保存。克隆前安装 Git LFS，克隆后执行：

    git lfs install
    git lfs pull

## 开发入口

先阅读 little-protagonist/AGENTS.md、little-protagonist/README.md 和 little-protagonist/migration/STARTUP.md，再进入应用目录：

    cd little-protagonist
    npm test
    npm run preview

实际平台凭据和部署环境须在本机配置，参考 .env.example；运行数据库和认证状态不在仓库中。
本次仅归档当前文件，没有改写原应用仓库的分支、远程地址或提交历史。

## 还原大 PDF

为保证网络传输可靠，18 份大 PDF 以无损分卷保存于 pdf-parts/，每卷最多 8 MiB。
这不是压缩或降清晰度：还原后的文件逐字节与原 PDF 一致，路径、大小及 SHA-256 记录在 PDF-PARTS.json 和 FILE-MANIFEST.json 中。其余文件按原文件保存。

安装 Git LFS 和 Node.js 后，Windows 可双击根目录的“还原大PDF.cmd”；也可在仓库根目录执行：

    git lfs pull
    node restore-large-pdfs.cjs

只校验所有分卷及原 PDF 的完整哈希而不生成文件：

    node restore-large-pdfs.cjs --verify-only

还原程序在原路径生成 PDF；遇到同名但内容不同的文件会停止，不会覆盖已有文件。还原文件已加入忽略规则，分卷始终保留在仓库内。
