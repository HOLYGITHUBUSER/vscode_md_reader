# MD Reader 日常验收

用于装包后手测预览、主题与 Mermaid。

## 段落与列表

普通段落文字。支持 **粗体**、*斜体*、~~删除线~~。

- [x] 已完成任务
- [ ] 待办任务

## 表格

| 列 A | 列 B |
| --- | --- |
| 1 | 甲 |
| 2 | 乙 |

## 代码

```ts
const hello = 'world';
console.log(hello);
```

## Mermaid flowchart

```mermaid
graph TD
  A[打开 md] --> B[预览面板]
  B --> C{有图表?}
  C -->|是| D[Mermaid 渲染]
  C -->|否| E[纯 HTML]
```

## Mermaid sequence

```mermaid
sequenceDiagram
  participant U as 用户
  participant E as Extension
  participant W as Webview
  U->>E: 打开 .md
  E->>W: updateContent
  W-->>U: 显示预览
```

## Mermaid mindmap

```mermaid
mindmap
  root((MD Reader))
    预览
    Mermaid
    主题
```
