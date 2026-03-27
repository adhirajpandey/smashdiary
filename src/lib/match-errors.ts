export class MatchNotFoundError extends Error {
  constructor(message = "Match not found.") {
    super(message);
    this.name = "MatchNotFoundError";
    Object.setPrototypeOf(this, MatchNotFoundError.prototype);
  }
}
