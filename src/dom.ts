type EventNames = keyof HTMLElementEventMap
interface EventHandler<Event extends EventNames> {
  readonly callback: (
    this: HTMLObjectElement,
    $event: HTMLElementEventMap[Event],
  ) => unknown
  readonly options?: boolean | EventListenerOptions
}

export type NodeDefinition =
  | readonly [keyof HTMLElementTagNameMap, NodeOptions]
  | readonly [keyof HTMLElementTagNameMap]
  | HTMLElement

export interface NodeOptions {
  readonly id?: string
  readonly classList?: string | readonly string[]
  readonly textContent?: string | { readonly html: string }
  readonly attributes?: { readonly [attributeName: string]: string }
  readonly children?: readonly NodeDefinition[]
  readonly listeners?: { readonly [Event in EventNames]?: EventHandler<Event> }
}

export function createNode<Tag extends keyof HTMLElementTagNameMap>(
  tag: Tag,
  options?: NodeOptions,
): HTMLElementTagNameMap[Tag] {
  const node = document.createElement(tag)
  if (options === undefined) {
    return node
  }
  if (options.id) {
    node.id = options.id
  }
  return addListeners(
    addChildren(
      addAttributes(
        addContent(addClasses(node, options.classList), options.textContent),
        options.attributes,
      ),
      options.children,
    ),
    options.listeners,
  )
}

export function debounce<E extends Event, F extends ($event: E) => unknown>(
  eventHandler: F,
  milliseconds = 500,
): ($event: E) => Promise<ReturnType<F>> {
  let timer: ReturnType<typeof setTimeout> | undefined
  return ($event: E) => {
    return new Promise(resolve => {
      if (timer !== undefined) {
        clearTimeout(timer)
      }
      timer = setTimeout(
        () => resolve(eventHandler($event) as ReturnType<F>),
        milliseconds,
      )
    })
  }
}

type Entry = [EventNames, EventHandler<EventNames> | undefined]

function addListeners<E extends HTMLElement>(
  node: E,
  listeners?: NodeOptions['listeners'],
): E {
  if (listeners) {
    for (const [name, handler] of Object.entries(listeners) as Entry[]) {
      if (handler) {
        node.addEventListener(name, handler.callback, handler.options)
      }
    }
  }
  return node
}

function addChildren<E extends HTMLElement>(
  node: E,
  children: NodeOptions['children'],
): E {
  if (children && children.length > 0) {
    for (const child of children) {
      if (child instanceof HTMLElement) {
        node.append(child)
      } else {
        node.append(createNode(child[0], child[1]))
      }
    }
  }
  return node
}

function addAttributes<E extends HTMLElement>(
  node: E,
  attributes: NodeOptions['attributes'],
): E {
  if (attributes) {
    for (const [attributeName, value] of Object.entries(attributes)) {
      node.setAttribute(attributeName, value)
    }
  }
  return node
}

function addContent<E extends HTMLElement>(
  node: E,
  textContent: NodeOptions['textContent'],
): E {
  if (textContent) {
    if (typeof textContent === 'string') {
      node.textContent = textContent
    } else if (textContent.html) {
      node.innerHTML = textContent.html
    }
  }
  return node
}

function addClasses<E extends HTMLElement>(
  node: E,
  classList: NodeOptions['classList'],
): E {
  if (classList) {
    if (typeof classList === 'string' && classList !== '') {
      node.classList.add(classList)
    }
    if (classList instanceof Array) {
      node.classList.add(...classList.filter(Boolean))
    }
  }
  return node
}
