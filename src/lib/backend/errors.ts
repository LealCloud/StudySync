export class BackendOperationError<C extends string = string> extends Error {
  readonly status: number;
  readonly code: C;

  get extensions(): { code: C; status: number } {
    return { code: this.code, status: this.status };
  }

  constructor(status: number, code: C) {
    super(code);
    this.name = 'BackendOperationError';
    this.status = status;
    this.code = code;
  }
}
