require "jsduck/tag/tag"

class Typescript < JsDuck::Tag::Tag
  def initialize
    @tagname = :typescript
    @pattern = "typescript"
    @html_position = POS_DOC + 0.1
    @repeatable = true
  end

  def parse_doc(scanner, position)
    text = scanner.match(/.*$/)
    return { :tagname => :typescript, :text => text }
  end

  def process_doc(context, typescript_tags, position)
    context[:typescript] = typescript_tags.map {|tag| tag[:text] }
  end

  def to_html(context)
    ""
  end
end