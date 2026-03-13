import CourseForm from "@/components/CourseForm";

const NewCoursePage = () => {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 mt-10">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-bold">Design Your Learning Path</h1>
        <p className="text-lg text-muted-foreground">
          Tell us what you want to learn, your skill level, and how much time
          you have. Our AI will generate a highly structured curriculum just for
          you.
        </p>
      </div>

      <div className="p-8 border rounded-2xl bg-card shadow-sm mt-8">
        <CourseForm />
      </div>
    </div>
  );
};

export default NewCoursePage;
