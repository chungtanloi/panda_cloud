export interface ProjectsService { list(): Promise<unknown[]>; get(id: string): Promise<unknown>; }
export const projectService: ProjectsService | null = null;
