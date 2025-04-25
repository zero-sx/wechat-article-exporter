import JSZip from "jszip"
import { saveAs } from "file-saver"
import { format } from "date-fns"
import {
  downloadArticleHTMLs,
  packHTMLAssets,
  resolveArticleHTML,
} from "~/utils"
import ExcelJS from "exceljs"
import type { Article, DownloadableArticle } from "~/types/types"

async function exportToExcel(articleList: Article[], filename: string) {
  // 创建工作簿和工作表
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet("Sheet1")

  // 设置表头
  worksheet.columns = [
    { header: "序号", key: "index", width: 10 },
    { header: "公众号", key: "accountName", width: 20 },
    { header: "作者", key: "author", width: 20 },
    { header: "是否原创", key: "copyright", width: 12 },
    { header: "标题", key: "title", width: 85 },
    // { header: "摘要", key: "description", width: 50 },
    { header: "发布时间", key: "publishTime", width: 20 },
    { header: "链接", key: "url", width: 25 },
    { header: "文章内容", key: "content", width: 100 },
    // { header: "所属合集", key: "album", width: 30 },
    // { header: "封面图链接", key: "cover", width: 25 },
  ]

  // 添加数据
  let index = 1
  articleList.forEach((item) => {
    worksheet.addRow({
      index: index++,
      accountName: item.accountName,
      author: item.author,
      copyright: item.copyright ? "原创" : "",
      title: item.title,
      description: item.description,
      publishTime: item.publishTime,
      url: item.url,
      content: item.content,
      album: item.albumList.map((album) => "#" + album.title).join(" "),
      cover: item.cover,
    })
  })

  // 导出为 Excel 文件
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: "application/octet-stream" })
  saveAs(blob, `${filename}.xlsx`)
}

/**
 * 批量下载缓存文章
 * @param articles
 * @param filename
 */
export function useBatchDownload() {
  const loading = ref(false)
  const phase = ref()
  const downloadedCount = ref(0)
  const packedCount = ref(0)

  async function download(
    articles: DownloadableArticle[],
    filename: string,
    fileType: string | null = null
  ) {
    loading.value = true
    try {
      phase.value = "下载文章内容"
      const results = await downloadArticleHTMLs(articles, (count: number) => {
        downloadedCount.value = count
      })
      switch (fileType) {
        case "excel":
          const resolveResults = await resolveArticleHTML(articles)
          exportToExcel(resolveResults, filename)
          break
        default:
          phase.value = "打包"
          const zip = new JSZip()
          for (const article of results) {
            await packHTMLAssets(
              article.html!,
              article.title.replaceAll(".", "_"),
              zip.folder(
                format(new Date(article.date * 1000), "yyyy-MM-dd") +
                  " " +
                  article.title.replace(/\//g, "_")
              )!
            )
            packedCount.value++
          }

          const blob = await zip.generateAsync({ type: "blob" })
          saveAs(blob, `${filename}.zip`)
          break
      }
    } catch (e: any) {
      alert(e.message)
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    phase,
    downloadedCount,
    packedCount,
    download,
  }
}

/**
 * 批量下载合集文章
 */
export function useDownloadAlbum() {
  const loading = ref(false)
  const phase = ref()
  const downloadedCount = ref(0)
  const packedCount = ref(0)

  async function download(articles: DownloadableArticle[], filename: string) {
    loading.value = true

    try {
      phase.value = "下载文章内容"
      const results = await downloadArticleHTMLs(articles, (count: number) => {
        downloadedCount.value = count
      })

      phase.value = "打包"
      const zip = new JSZip()
      for (const article of results) {
        await packHTMLAssets(
          article.html!,
          article.title.replaceAll(".", "_"),
          zip.folder(
            format(new Date(+article.date * 1000), "yyyy-MM-dd") +
              " " +
              article.title.replace(/\//g, "_")
          )!
        )
        packedCount.value++
      }

      const blob = await zip.generateAsync({ type: "blob" })
      saveAs(blob, `${filename}.zip`)
    } catch (e: any) {
      alert(e.message)
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    phase,
    downloadedCount,
    packedCount,
    download,
  }
}
