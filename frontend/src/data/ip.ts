export default function getIP() {
  const withoutSchema = window.location.origin.split("//")[1];
  const withoutPort = withoutSchema.split(":")[0];

  return withoutPort;
}
