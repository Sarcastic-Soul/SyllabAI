interface CreateCourse {
  topic: string;
  duration: number;
  difficulty: string;
}

interface SearchParams {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}
