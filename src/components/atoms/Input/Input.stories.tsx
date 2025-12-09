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
      options: ["default", "hovered", "filled", "selected", "disabled", "error", "Filled + Multiselect"],
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
    hasPlaceholder: {
      control: "boolean",
      description: "Whether to show placeholder",
    },
    placeholderText: {
      control: "text",
      description: "Placeholder text",
    },
    hasContent: {
      control: "boolean",
      description: "Whether the input has default content",
    },
    contentText: {
      control: "text",
      description: "Default content text",
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

  return <Input {...args} value={value} onChange={(e) => setValue(e.target.value)} />
}

export const Default: Story = {
  args: {
    size: "md",
    variant: "flat",
    state: "default",
    hasTitle: true,
    title: "Email Address",
    hasPlaceholder: true,
    placeholderText: "Enter your email",
    hasContent: false,
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
    hasPlaceholder: true,
    placeholderText: "Search products...",
    hasStartIcon: true,
    startIcon: <MagnifyingGlass />,
    hasContent: false,
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
    hasPlaceholder: true,
    placeholderText: "Search...",
    hasEndIcon: true,
    endIcon: <MagnifyingGlass />,
    hasContent: false,
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
    hasPlaceholder: true,
    placeholderText: "Enter your password",
    hasContent: true,
    contentText: "secretpassword123",
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
    hasPlaceholder: false,
    hasContent: true,
    contentText: "invalid-email",
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
    hasPlaceholder: false,
    hasContent: true,
    contentText: "Cannot edit this",
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
    hasPlaceholder: true,
    placeholderText: "Enter username",
    hasContent: false,
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
    hasPlaceholder: true,
    placeholderText: "Enter password",
    hasContent: false,
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
    hasPlaceholder: true,
    placeholderText: "Small size",
    hasContent: false,
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
    hasPlaceholder: true,
    placeholderText: "Bordered variant",
    hasContent: false,
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
    hasPlaceholder: true,
    placeholderText: "Underlined variant",
    hasContent: false,
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
    hasContent: true,
    contentText: "user@example.com",
    type: "email",
  },
  render: (args) => <ControlledInput {...args} />,
}
