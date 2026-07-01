const TABLE_SEPARATOR_PATTERN = /^\s*\|?[\s:-]+\|[\s|:-]*$/

export function RichMessageContent({ content }) {
  const blocks = parseMessageBlocks(content)

  if (blocks.length === 0) {
    return <p className="message-plain-text">{content}</p>
  }

  return (
    <div className="rich-message-content">
      {blocks.map((block, index) => renderBlock(block, `block-${index}`))}
    </div>
  )
}

function parseMessageBlocks(content) {
  const lines = String(content ?? '').replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const trimmedLine = line.trim()

    if (!trimmedLine) {
      index += 1
      continue
    }

    const codeFenceMatch = trimmedLine.match(/^```([\w-]+)?/)
    if (codeFenceMatch) {
      const codeLines = []
      index += 1

      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index])
        index += 1
      }

      blocks.push({
        type: 'code',
        language: codeFenceMatch[1] ?? '',
        content: codeLines.join('\n'),
      })
      index += index < lines.length ? 1 : 0
      continue
    }

    const headingMatch = trimmedLine.match(/^(#{2,4})\s+(.+)$/)
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2],
      })
      index += 1
      continue
    }

    if (isTableStart(lines, index)) {
      const tableLines = [lines[index], lines[index + 1]]
      index += 2

      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        tableLines.push(lines[index])
        index += 1
      }

      blocks.push(parseTableBlock(tableLines))
      continue
    }

    const unorderedMatch = trimmedLine.match(/^[-*]\s+(.+)$/)
    if (unorderedMatch) {
      const items = []

      while (index < lines.length) {
        const itemMatch = lines[index].trim().match(/^[-*]\s+(.+)$/)

        if (!itemMatch) {
          break
        }

        items.push(itemMatch[1])
        index += 1
      }

      blocks.push({ type: 'list', ordered: false, items })
      continue
    }

    const orderedMatch = trimmedLine.match(/^\d+[.)]\s+(.+)$/)
    if (orderedMatch) {
      const items = []

      while (index < lines.length) {
        const itemMatch = lines[index].trim().match(/^\d+[.)]\s+(.+)$/)

        if (!itemMatch) {
          break
        }

        items.push(itemMatch[1])
        index += 1
      }

      blocks.push({ type: 'list', ordered: true, items })
      continue
    }

    if (trimmedLine.startsWith('>')) {
      const quoteLines = []

      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''))
        index += 1
      }

      blocks.push({ type: 'quote', content: quoteLines.join(' ') })
      continue
    }

    const paragraphLines = []

    while (index < lines.length && lines[index].trim() && !startsSpecialBlock(lines, index)) {
      paragraphLines.push(lines[index].trim())
      index += 1
    }

    blocks.push({ type: 'paragraph', content: paragraphLines.join(' ') })
  }

  return blocks
}

function startsSpecialBlock(lines, index) {
  const trimmedLine = lines[index].trim()

  return (
    trimmedLine.startsWith('```') ||
    /^#{2,4}\s+/.test(trimmedLine) ||
    /^[-*]\s+/.test(trimmedLine) ||
    /^\d+[.)]\s+/.test(trimmedLine) ||
    trimmedLine.startsWith('>') ||
    isTableStart(lines, index)
  )
}

function isTableStart(lines, index) {
  return (
    index + 1 < lines.length &&
    lines[index].includes('|') &&
    TABLE_SEPARATOR_PATTERN.test(lines[index + 1])
  )
}

function parseTableBlock(lines) {
  const [headerLine, , ...rowLines] = lines

  return {
    type: 'table',
    headers: parseTableCells(headerLine),
    rows: rowLines.map(parseTableCells).filter((cells) => cells.length > 0),
  }
}

function parseTableCells(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function renderBlock(block, key) {
  if (block.type === 'heading') {
    const HeadingTag = `h${Math.min(4, Math.max(3, block.level + 1))}`

    return <HeadingTag key={key}>{renderInline(block.content, key)}</HeadingTag>
  }

  if (block.type === 'list') {
    const ListTag = block.ordered ? 'ol' : 'ul'

    return (
      <ListTag key={key}>
        {block.items.map((item, index) => (
          <li key={`${key}-item-${index}`}>{renderInline(item, `${key}-item-${index}`)}</li>
        ))}
      </ListTag>
    )
  }

  if (block.type === 'quote') {
    return <blockquote key={key}>{renderInline(block.content, key)}</blockquote>
  }

  if (block.type === 'code') {
    return (
      <figure key={key} className="rich-code-block">
        {block.language ? <figcaption>{block.language}</figcaption> : null}
        <pre>
          <code>{block.content}</code>
        </pre>
      </figure>
    )
  }

  if (block.type === 'table') {
    return (
      <div key={key} className="rich-table-wrapper">
        <table>
          <thead>
            <tr>
              {block.headers.map((header, index) => (
                <th key={`${key}-head-${index}`}>{renderInline(header, `${key}-head-${index}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={`${key}-row-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${key}-cell-${rowIndex}-${cellIndex}`}>
                    {renderInline(cell, `${key}-cell-${rowIndex}-${cellIndex}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return <p key={key}>{renderInline(block.content, key)}</p>
}

function renderInline(text, keyPrefix) {
  const parts = []
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  let lastIndex = 0
  let match

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    parts.push(renderInlineToken(match[0], `${keyPrefix}-inline-${parts.length}`))
    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

function renderInlineToken(token, key) {
  if (token.startsWith('**') && token.endsWith('**')) {
    return <strong key={key}>{token.slice(2, -2)}</strong>
  }

  if (token.startsWith('`') && token.endsWith('`')) {
    return <code key={key}>{token.slice(1, -1)}</code>
  }

  const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)

  if (linkMatch) {
    return (
      <a key={key} href={linkMatch[2]} target="_blank" rel="noreferrer">
        {linkMatch[1]}
      </a>
    )
  }

  return token
}
