项目是标准的 Next.js 14，没有 @cloudflare/next-on-pages 适配器。所以 pages_build_output_dir = ".next" 不管用——Cloudflare Pages 没法直接读取 .next/ 目录的产物。
原来的配置反而能跑（pages_build_output_dir = "/" + npx wrangler deploy），因为 wrangler deploy 有自己的处理方式。
回退到能跑的配置：
1. 去 GitHub 改 wrangler.toml：
