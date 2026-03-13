生成的新 db-manifest.json 和 media-manifest.json 仍然是完整清单
但打包出来的 media/ 只包含相对上一版新增或变化的媒体文件
db/ 只有在 SR.db 的 SHA256 变化时才会带上
适合把增量包“覆盖上传”到你现有远端内容目录
