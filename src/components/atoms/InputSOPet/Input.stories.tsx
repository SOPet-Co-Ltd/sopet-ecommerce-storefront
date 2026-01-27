import type { Meta, StoryObj } from "@storybook/react"
import { Input } from "./Input"
import { MagnifyingGlass } from "@medusajs/icons"
import { useState } from "react"

const meta: Meta<typeof Input> = {
  title: "Atoms/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md"],
      description: "Input size variant",
    },
    state: {
      control: "select",
      options: ["default", "hover", "filled", "disabled", "error"],
      description: "Input state",
    },
    variant: {
      control: "select",
      options: ["flat", "bordered", "underlined"],
      description: "Input variant style",
    },
    title: {
      control: "text",
      description: "Title/label text (shown if provided)",
    },
    isRequire: {
      control: "boolean",
      description: "Whether the field is required (shows asterisk)",
    },
    startIcon: {
      control: false,
      description: "Start icon (shown if provided)",
    },
    endIcon: {
      control: false,
      description: "End icon (shown if provided, hidden for password type)",
    },
    description: {
      control: "text",
      description: "Description/helper text (shown if provided)",
    },
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url"],
      description: "Input type",
    },
  },
}

export default meta
type Story = StoryObj<typeof Input>

// Wrapper component for controlled input
const ControlledInput = (args: any) => {
  const [value, setValue] = useState(args.value || "")

  return (
    <Input {...args} value={value} onChange={(e) => setValue(e.target.value)} />
  )
}

export const Default: Story = {
  args: {
    size: "md",
    variant: "flat",
    state: "default",
    title: "Email Address",
    placeholder: "Enter your email",
    type: "text",
  },
  render: (args) => <ControlledInput {...args} />,
}

export const WithStartIcon: Story = {
  args: {
    size: "md",
    variant: "flat",
    state: "default",
    title: "Search",
    placeholder: "Search products...",
    startIcon: <MagnifyingGlass />,
    type: "text",
  },
  render: (args) => <ControlledInput {...args} />,
}

export const WithEndIcon: Story = {
  args: {
    size: "md",
    variant: "flat",
    state: "default",
    title: "Search",
    placeholder: "Search...",
    endIcon: <MagnifyingGlass />,
    type: "text",
  },
  render: (args) => <ControlledInput {...args} />,
}

export const Password: Story = {
  args: {
    size: "md",
    variant: "flat",
    state: "default",
    title: "Password",
    placeholder: "Enter your password",
    value: "secretpassword123",
    type: "password",
  },
  render: (args) => <ControlledInput {...args} />,
}

export const WithError: Story = {
  args: {
    size: "md",
    variant: "flat",
    state: "error",
    title: "Email",
    value: "invalid-email",
    description: "Please enter a valid email address",
    type: "email",
  },
  render: (args) => <ControlledInput {...args} />,
}

export const Disabled: Story = {
  args: {
    size: "md",
    variant: "flat",
    state: "disabled",
    title: "Disabled Input",
    value: "Cannot edit this",
    type: "text",
  },
  render: (args) => <ControlledInput {...args} />,
}

export const Required: Story = {
  args: {
    size: "md",
    variant: "flat",
    state: "default",
    title: "Username",
    isRequire: true,
    placeholder: "Enter username",
    type: "text",
  },
  render: (args) => <ControlledInput {...args} />,
}

export const WithDescription: Story = {
  args: {
    size: "md",
    variant: "flat",
    state: "default",
    title: "Password",
    placeholder: "Enter password",
    description: "Must be at least 8 characters",
    type: "password",
  },
  render: (args) => <ControlledInput {...args} />,
}

export const WithDescriptionAndError: Story = {
  args: {
    size: "md",
    variant: "flat",
    state: "error",
    title: "Email",
    placeholder: "Enter your email",
    value: "invalid-email",
    description: "Please enter a valid email address",
    type: "email",
  },
  render: (args) => <ControlledInput {...args} />,
}

export const SmallSize: Story = {
  args: {
    size: "sm",
    variant: "flat",
    state: "default",
    title: "Small Input",
    placeholder: "Small size",
    type: "text",
  },
  render: (args) => <ControlledInput {...args} />,
}

export const Bordered: Story = {
  args: {
    size: "md",
    variant: "bordered",
    state: "default",
    title: "Bordered Input",
    placeholder: "Bordered variant",
    type: "text",
  },
  render: (args) => <ControlledInput {...args} />,
}

export const Underlined: Story = {
  args: {
    size: "md",
    variant: "underlined",
    state: "default",
    title: "Underlined Input",
    placeholder: "Underlined variant",
    type: "text",
  },
  render: (args) => <ControlledInput {...args} />,
}

export const Filled: Story = {
  args: {
    size: "md",
    variant: "flat",
    state: "filled",
    title: "Email",
    value: "user@example.com",
    type: "email",
  },
  render: (args) => <ControlledInput {...args} />,
}

export const Hover: Story = {
  args: {
    size: "md",
    variant: "flat",
    state: "hover",
    title: "Email",
    placeholder: "Hover state",
    type: "email",
  },
  render: (args) => <ControlledInput {...args} />,
}

export const WithoutTitle: Story = {
  args: {
    size: "md",
    variant: "flat",
    state: "default",
    placeholder: "Input without title",
    type: "text",
  },
  render: (args) => <ControlledInput {...args} />,
}

export const WithoutPlaceholder: Story = {
  args: {
    size: "md",
    variant: "flat",
    state: "default",
    title: "Input without placeholder",
    type: "text",
  },
  render: (args) => <ControlledInput {...args} />,
}

export const FullFeatured: Story = {
  args: {
    size: "md",
    variant: "flat",
    state: "default",
    title: "Full Name",
    isRequire: true,
    placeholder: "Enter your full name",
    startIcon: <MagnifyingGlass />,
    description: "Enter your first and last name",
    type: "text",
  },
  render: (args) => <ControlledInput {...args} />,
}

export const PasswordWithToggle: Story = {
  args: {
    size: "md",
    variant: "flat",
    state: "default",
    title: "Password",
    placeholder: "Enter your password",
    description: "Password must be at least 8 characters",
    type: "password",
  },
  render: (args) => <ControlledInput {...args} />,
}

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8 w-[400px]">
      <div>
        <h3 className="text-sm font-medium mb-4">Flat Variant</h3>
        <ControlledInput
          size="md"
          variant="flat"
          state="default"
          title="Flat Input"
          placeholder="Flat variant"
          type="text"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-4">Bordered Variant</h3>
        <ControlledInput
          size="md"
          variant="bordered"
          state="default"
          title="Bordered Input"
          placeholder="Bordered variant"
          type="text"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-4">Underlined Variant</h3>
        <ControlledInput
          size="md"
          variant="underlined"
          state="default"
          title="Underlined Input"
          placeholder="Underlined variant"
          type="text"
        />
      </div>
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-6 w-[400px]">
      <div>
        <h3 className="text-sm font-medium mb-4">Small Size</h3>
        <ControlledInput
          size="sm"
          variant="flat"
          state="default"
          title="Small Input"
          placeholder="Small size"
          type="text"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-4">Medium Size</h3>
        <ControlledInput
          size="md"
          variant="flat"
          state="default"
          title="Medium Input"
          placeholder="Medium size"
          type="text"
        />
      </div>
    </div>
  ),
}
