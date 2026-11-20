import {
  formatOgPathLabel,
  normalizeOgCardContent,
  OG_DEFAULT_TITLE,
  type OgCardContent,
} from "./og-card";

function titleFontSize(title: string): number {
  if (title.length <= 28) return 60;
  if (title.length <= 48) return 52;
  return 44;
}

function descriptionFontSize(description: string): number {
  return description.length > 140 ? 23 : 25;
}

export function renderOgCardElement(input: OgCardContent) {
  const { title, description, path } = normalizeOgCardContent(input);
  const pathLabel = formatOgPathLabel(path);
  const footerRightLabel =
    title.toLowerCase() === OG_DEFAULT_TITLE.toLowerCase()
      ? "ENTROS PROTOCOL"
      : "PRIVATE HUMAN VERIFICATION";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: "#000000",
        padding: "32px",
        fontFamily: "Geist",
        color: "#E8E6E0",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0A0A0F",
          border: "1px solid rgba(232, 230, 224, 0.14)",
          padding: "52px 60px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -1,
            left: -1,
            width: 120,
            height: 3,
            backgroundColor: "#00E7FE",
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 18 18">
              <path fill="#E8E6E0" d="M0 0h18v4H0zM0 7h12v4H0zM0 14h18v4H0z" />
              <path fill="#00E7FE" d="M14 7h4v4h-4z" />
            </svg>
            <span
              style={{
                fontFamily: "JetBrainsMono",
                fontSize: 32,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color: "#E8E6E0",
                marginLeft: 14,
              }}
            >
              Entros
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid rgba(232, 230, 224, 0.14)",
              backgroundColor: "#000000",
              padding: "8px 16px",
              fontFamily: "JetBrainsMono",
              fontSize: 16,
              letterSpacing: "0.02em",
              color: "#858595",
            }}
          >
            {pathLabel}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            paddingTop: 28,
            paddingBottom: 28,
          }}
        >
          <div
            style={{
              fontFamily: "Geist",
              fontSize: titleFontSize(title),
              lineHeight: 1.08,
              letterSpacing: "-0.025em",
              color: "#E8E6E0",
              maxWidth: 980,
            }}
          >
            {title}
          </div>

          <div
            style={{
              width: 48,
              height: 2,
              backgroundColor: "#00E7FE",
              marginTop: 26,
              marginBottom: 24,
              display: "flex",
            }}
          />

          <div
            style={{
              fontFamily: "Geist",
              fontSize: descriptionFontSize(description),
              lineHeight: 1.45,
              color: "rgba(232, 230, 224, 0.76)",
              maxWidth: 980,
            }}
          >
            {description}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(232, 230, 224, 0.12)",
            paddingTop: 22,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                backgroundColor: "#00E7FE",
                marginRight: 12,
                display: "flex",
              }}
            />
            <span
              style={{
                fontFamily: "JetBrainsMono",
                fontSize: 15,
                letterSpacing: "0.14em",
                color: "rgba(232, 230, 224, 0.72)",
              }}
            >
              SOLANA DEVNET
            </span>
          </div>

          <span
            style={{
              fontFamily: "JetBrainsMono",
              fontSize: 15,
              letterSpacing: "0.12em",
              color: "#858595",
            }}
          >
            {footerRightLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
