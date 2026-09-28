import Container from "@mui/material/Container";

export default function DealsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "stretch",
      }}
    >
      <Container
        maxWidth={false}
        component="main"
        sx={{
          pr: 1,
          pl: 0,
          pt: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {children}
      </Container>
    </section>
  );
}
