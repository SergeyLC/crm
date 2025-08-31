import Container from "@mui/material/Container";
import { ProtectedRoute } from "@/features/auth";
export default function DealsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
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
          component="article"
          sx={{
            pr: 0,
            pl: 0,
            pt: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {children}
        </Container>
      </section>
    </ProtectedRoute>
  );
}
