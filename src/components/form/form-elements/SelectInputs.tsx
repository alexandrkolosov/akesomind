"use client";

import { useState, useEffect } from "react";
import ComponentCard from "../../common/ComponentCard";
import Label from "../Label";
import Select from "../Select";
import MultiSelect from "../MultiSelect";

export default function SelectInputs() {
  const options = [
    { value: "marketing", label: "Marketing" },
    { value: "template", label: "Template" },
    { value: "development", label: "Development" },
  ];
  const handleSelectChange = (value: string) => {
    console.log("Selected value:", value);
  };
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const multiOptions = [
    { value: "1", text: "Option 1", selected: false },
    { value: "2", text: "Option 2", selected: false },
    { value: "3", text: "Option 3", selected: false },
    { value: "4", text: "Option 4", selected: false },
    { value: "5", text: "Option 5", selected: false },
  ];

  useEffect(() => {
    console.log("Selected multi-select values:", selectedValues);
  }, [selectedValues]);

  return (
    <ComponentCard title="Select Inputs">
      <div className="space-y-6">
        <div>
          <Label>Select Input</Label>
          <Select
            options={options}
            placeholder="Select Option"
            onChange={handleSelectChange}
            className="dark:bg-dark-900"
          />
        </div>
        <div>
          <MultiSelect
            label="Multiple Select Options"
            options={multiOptions}
            defaultSelected={["1", "3"]}
            onChange={(values) => setSelectedValues(values)}
          />
        </div>
        <div>
          <Label>Selected Values:</Label>
          <p>{selectedValues.join(", ")}</p>
        </div>
      </div>
    </ComponentCard>
  );
}
