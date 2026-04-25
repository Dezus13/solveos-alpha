export interface SolveRequest {
  problem: string;
}

export interface SolveResponse {
  result: unknown;
  error?: string;
}
