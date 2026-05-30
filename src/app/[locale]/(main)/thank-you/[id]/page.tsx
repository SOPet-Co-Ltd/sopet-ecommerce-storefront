type Props = {
  params: Promise<{ id: string }>
}

export default async function ThankYouPage(props: Props) {
  const { id } = await props.params
  return (
    <div>
      <h1>Thank You</h1>
      <p>Order ID: {id}</p>
    </div>
  )
}
