// Serviço abstrato de assinatura digital.
// Arquitetura pronta; integração real (ClickSign/ZapSign/DocuSign) virá depois.

export interface SignerData {
  nome: string;
  email: string;
  documento?: string;
}

export interface SignatureRequest {
  provider: string;
  externalRequestId: string;
  signingUrl: string;
  status: string;
}

export interface SignatureProvider {
  readonly name: string;
  createSignatureRequest(
    contractId: string,
    pdfUrl: string,
    signer: SignerData,
  ): Promise<SignatureRequest>;
}

/** Placeholder — lança aviso até a integração real ser ativada. */
export class PlaceholderSignatureProvider implements SignatureProvider {
  readonly name = "placeholder";
  async createSignatureRequest(): Promise<SignatureRequest> {
    throw new Error("Integração de assinatura digital em breve.");
  }
}

export const signatureProvider: SignatureProvider = new PlaceholderSignatureProvider();
