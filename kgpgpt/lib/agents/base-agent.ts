export abstract class BaseAgent {
  protected name: string;
  protected description: string;

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
  }

  abstract process(input: any): Promise<any>;

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  protected log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }

  protected error(message: string, error?: any): void {
    console.error(`[${this.name}] ERROR: ${message}`, error);
  }
}
