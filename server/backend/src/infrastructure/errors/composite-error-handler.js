class CompositeErrorHandler {
  constructor(handlers = []) {
    this.handlers = handlers;
  }

  handle(error) {
    for (const handler of this.handlers) {
      const result = handler.handle(error);
      if (result) return result;
    }
    return null;
  }
}

module.exports = CompositeErrorHandler;