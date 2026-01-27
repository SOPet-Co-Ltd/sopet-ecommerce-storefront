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
      options: [
        "default",
        "hovered",
        "filled",
        "selected",
        "disabled",
        "error",
      ],
      description: "Input state",
    },
    variant: {
      control: "select",
      options: ["flat", "bordered", "underlined"],
      description: "Input variant style",
    },
    hasTitle: {
      control: "boolean",
      description: "Whether to show the title/label",
    },
    title: {
      control: "text",
      description: "Title/label text",
    },
    isRequired: {
      control: "boolean",
      description: "Whether the field is required (shows asterisk)",
    },
    hasStartIcon: {
      control: "boolean",
      description: "Whether to show start icon",
    },
    hasEndIcon: {
      control: "boolean",
      description: "Whether to show end icon",
    },
    withDescription: {
      control: "boolean",
      description: "Whether to show description text",
    },
    descriptionText: {
      control: "text",
      description: "Description/helper text",
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
    hasTitle: true,
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
    hasTitle: true,
    title: "Search",
    placeholder: "Search products...",
    hasStartIcon: true,
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
    hasTitle: true,
    title: "Search",
    placeholder: "Search...",
    hasEndIcon: true,
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
    hasTitle: true,
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
    hasTitle: true,
    title: "Email",
    value: "invalid-email",
    withDescription: true,
    descriptionText: "Please enter a valid email address",
    type: "email",
  },
  render: (args) => <ControlledInput {...args} />,
}

export const Disabled: Story = {
  args: {
    size: "md",
    variant: "flat",
    state: "disabled",
    hasTitle: true,
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
    hasTitle: true,
    title: "Username",
    isRequired: true,
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
    hasTitle: true,
    title: "Password",
    placeholder: "Enter password",
    withDescription: true,
    descriptionText: "Must be at least 8 characters",
    type: "password",
  },
  render: (args) => <ControlledInput {...args} />,
}

export const SmallSize: Story = {
  args: {
    size: "sm",
    variant: "flat",
    state: "default",
    hasTitle: true,
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
    hasTitle: true,
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
    hasTitle: true,
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
    hasTitle: true,
    title: "Email",
    value: "user@example.com",
    type: "email",
  },
  render: (args) => <ControlledInput {...args} />,
}
