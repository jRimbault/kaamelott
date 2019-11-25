declare interface TypedResponse<T> extends Response {
  json(): Promise<T>
}

declare function fetch<T>(input: RequestInfo, init?: RequestInit): Promise<TypedResponse<T>>;
