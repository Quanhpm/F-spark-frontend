import {
  Button,
  Card,
  CardContent,
  Select,
  TextInput,
} from "@/shared/components";

type MilestoneFiltersProps = {
  courseCode: string;
  courseOptions: string[];
  onCourseCodeChange: (value: string) => void;
  onTermChange: (value: string) => void;
  term: string;
  termOptions: string[];
};

export function MilestoneFilters({
  courseCode,
  courseOptions,
  onCourseCodeChange,
  onTermChange,
  term,
  termOptions,
}: MilestoneFiltersProps) {
  return (
    <Card>
      <CardContent className="grid gap-5">
        <div className="grid grid-cols-[repeat(2,minmax(180px,240px))_minmax(0,1fr)] items-end gap-3 max-[760px]:grid-cols-1">
          <TextInput
            label="Term"
            list="milestone-term-options"
            onChange={(event) => onTermChange(event.target.value)}
            placeholder="Summer2026"
            value={term}
          />
          <datalist id="milestone-term-options">
            {termOptions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
          <Select
            label="Course code"
            onChange={(event) => onCourseCodeChange(event.target.value)}
            value={courseCode}
          >
            <option value="">Select course</option>
            {courseOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Button
            className="w-fit justify-self-end border-neutral-200 bg-neutral-100 px-4 text-muted [&:hover:not(:disabled)]:border-neutral-300 [&:hover:not(:disabled)]:bg-neutral-200 max-[760px]:w-full max-[760px]:justify-self-stretch"
            onClick={() => {
              onTermChange("");
              onCourseCodeChange("");
            }}
            variant="secondary"
          >
            Clear filters
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
