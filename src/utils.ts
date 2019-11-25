type EventNames = keyof HTMLElementEventMap
type EventHandler<Event extends EventNames> = {
  readonly callback: (this: HTMLObjectElement, $event: HTMLElementEventMap[Event]) => unknown,
  readonly options?: boolean | EventListenerOptions
}

export type NodeOptions = {
  id?: string
  classList?: string | readonly string[]
  textContent?: string | { readonly html: string }
  attributes?: { readonly [attributeName: string]: string }
  children?: readonly HTMLElement[]
  listeners?: { readonly [Event in EventNames]?: EventHandler<Event> }
}

export function createNode<Tag extends keyof HTMLElementTagNameMap>(tag: Tag, options?: NodeOptions): HTMLElementTagNameMap[Tag] {
  const node = document.createElement(tag)
  if (options === undefined) {
    return node
  }
  if (options.id) {
    node.id = options.id
  }
  addClasses(node, options.classList)
  addContent(node, options.textContent)
  addAttributes(node, options.attributes)
  addChildren(node, options.children)
  addListeners(node, options.listeners)
  return node
}

type Entry = [EventNames, EventHandler<EventNames> | undefined]

function addListeners(node: HTMLElement, listeners?: NodeOptions['listeners']) {
  if (listeners) {
    for (const [name, handler] of Object.entries(listeners) as Entry[]) {
      if (handler) {
        node.addEventListener(name, handler.callback, handler.options);
      }
    }
  }
}

function addChildren(node: HTMLElement, children: NodeOptions['children']) {
  if (children && children.length > 0) {
    node.append(...children)
  }
}

function addAttributes(node: HTMLElement, attributes: NodeOptions['attributes']) {
  if (attributes) {
    for (const [attributeName, value] of Object.entries(attributes)) {
      node.setAttribute(attributeName, value)
    }
  }
}

function addContent(node: HTMLElement, textContent: NodeOptions['textContent']) {
  if (textContent) {
    if (typeof textContent === 'string') {
      node.textContent = textContent
    } else if (textContent.html) {
      node.innerHTML = textContent.html
    }
  }
}

function addClasses(node: HTMLElement, classList: NodeOptions['classList']) {
  if (classList) {
    if (typeof classList === 'string' && classList !== '') {
      node.classList.add(classList)
    }
    if (classList instanceof Array) {
      node.classList.add(...(classList.filter(Boolean)))
    }
  }
}
