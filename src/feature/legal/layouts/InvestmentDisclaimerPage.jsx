import LegalDocument from "../components/LegalDocument";
import { INVESTMENT_DISCLAIMER } from "../content/investmentDisclaimer";

// Route công khai /legal/disclaimer.
export default function InvestmentDisclaimerPage() {
  return <LegalDocument document={INVESTMENT_DISCLAIMER} />;
}
