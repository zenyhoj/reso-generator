
import { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle, VerticalAlign } from "docx";
import { saveAs } from "file-saver";
import { ResolutionFormValues } from "@/types/schema";

interface ExportOptions {
    data: ResolutionFormValues;
    orgSettings?: {
        water_district_name?: string;
        address?: string;
        logo_url?: string;
        water_district_email?: string;
        water_district_contact?: string;
    };
}

type Signatory = ResolutionFormValues["signatories"][number];

export async function exportToDocx({ data, orgSettings }: ExportOptions) {
    // 8.5 x 13 inches in Twips (1 inch = 1440 twips)
    const PAGE_WIDTH = 8.5 * 1440;
    const PAGE_HEIGHT = 13 * 1440;
    const MARGIN = 1 * 1440;

    let logoImage: ImageRun | null = null;

    // Attempt to fetch logo if exists
    if (orgSettings?.logo_url) {
        try {
            const response = await fetch(orgSettings.logo_url);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            logoImage = new ImageRun({
                data: new Uint8Array(arrayBuffer),
                transformation: {
                    width: 80,
                    height: 80,
                },
                type: "png",
            } as ConstructorParameters<typeof ImageRun>[0]);
        } catch (e) {
            console.error("Failed to load logo for docx:", e);
        }
    }

    // Attempt to fetch all signature images
    const signatureImages: Record<number, ImageRun> = {};
    if (data.signatories && data.signatories.length > 0) {
        await Promise.all(data.signatories.map(async (signer, index) => {
            if (signer.signatureUrl) {
                try {
                    const response = await fetch(signer.signatureUrl);
                    const blob = await response.blob();
                    const arrayBuffer = await blob.arrayBuffer();
                    signatureImages[index] = new ImageRun({
                        data: new Uint8Array(arrayBuffer),
                        transformation: {
                            width: 120,
                            height: 60,
                        },
                        type: "png",
                    } as ConstructorParameters<typeof ImageRun>[0]);
                } catch (e) {
                    console.error(`Failed to load signature for ${signer.name}:`, e);
                }
            }
        }));
    }

    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        size: {
                            width: PAGE_WIDTH,
                            height: PAGE_HEIGHT,
                        },
                        margin: {
                            top: MARGIN,
                            right: MARGIN,
                            bottom: MARGIN,
                            left: MARGIN,
                        },
                    },
                },
                children: [
                    // Header Section (Logo + Text)
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.NONE },
                            bottom: { style: BorderStyle.NONE },
                            left: { style: BorderStyle.NONE },
                            right: { style: BorderStyle.NONE },
                            insideHorizontal: { style: BorderStyle.NONE },
                            insideVertical: { style: BorderStyle.NONE },
                        },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        width: { size: 20, type: WidthType.PERCENTAGE },
                                        children: logoImage ? [new Paragraph({ children: [logoImage], alignment: AlignmentType.LEFT })] : [],
                                        verticalAlign: VerticalAlign.CENTER,
                                    }),
                                    new TableCell({
                                        width: { size: 60, type: WidthType.PERCENTAGE },
                                        children: [
                                            new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [
                                                    new TextRun({ text: "Republic of the Philippines", bold: true, size: 20, font: "Georgia" }),
                                                ],
                                            }),
                                            new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [
                                                    new TextRun({
                                                        text: orgSettings?.water_district_name || "Water District Name",
                                                        bold: true,
                                                        size: 24,
                                                        font: "Georgia",
                                                        allCaps: true
                                                    }),
                                                ],
                                            }),
                                            new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [
                                                    new TextRun({ text: orgSettings?.address || "City/Municipality, Province", size: 18, font: "Georgia" }),
                                                ],
                                            }),
                                            new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [
                                                    new TextRun({
                                                        text: `${orgSettings?.water_district_email ? `Email: ${orgSettings.water_district_email}` : ""} ${orgSettings?.water_district_contact ? `| Contact: ${orgSettings.water_district_contact}` : ""}`,
                                                        size: 16,
                                                        font: "Georgia"
                                                    }),
                                                ],
                                            }),
                                        ],
                                        verticalAlign: VerticalAlign.CENTER,
                                    }),
                                    new TableCell({
                                        width: { size: 20, type: WidthType.PERCENTAGE },
                                        children: [],
                                    }),
                                ],
                            }),
                        ],
                    }),

                    new Paragraph({ spacing: { before: 400, after: 400 } }), // Separator space

                    // Minutes Excerpt
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: `EXCERPTS FROM THE MINUTES OF THE REGULAR MEETING OF THE BOARD OF DIRECTORS OF `,
                                font: "Georgia"
                            }),
                            new TextRun({
                                text: (orgSettings?.water_district_name || "WATER DISTRICT NAME").toUpperCase(),
                                bold: true,
                                font: "Georgia"
                            }),
                            new TextRun({
                                text: ` HELD ON `,
                                font: "Georgia"
                            }),
                            new TextRun({
                                text: (data.heldOn ? new Date(data.heldOn).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "[DATE]").toUpperCase(),
                                bold: true,
                                font: "Georgia"
                            }),
                            new TextRun({
                                text: ` AT THE BOARD ROOM.`,
                                font: "Georgia"
                            }),
                        ],
                        spacing: { line: 360 },
                    }),

                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 400, after: 400 },
                        children: [
                            new TextRun({
                                text: `Resolution No. ${data.resolutionNumber || "___"}-Series of ${data.seriesYear}`,
                                bold: true,
                                size: 24,
                                font: "Georgia"
                            }),
                        ],
                    }),

                    // Title
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 600 },
                        children: [
                            new TextRun({
                                text: `"${data.title || "TITLE OF THE RESOLUTION"}"`,
                                bold: true,
                                size: 28,
                                font: "Georgia",
                                allCaps: true
                            }),
                        ],
                    }),

                    // WHEREAS Clauses
                    ...data.whereasClauses.flatMap((clause) => {
                        const cleanClause = clause.replace(/^(WHEREAS,?\s*)/i, "").trim();
                        return [
                            new Paragraph({
                                alignment: AlignmentType.BOTH,
                                spacing: { after: 200 },
                                children: [
                                    new TextRun({ text: "WHEREAS, ", bold: true, font: "Georgia" }),
                                    new TextRun({ text: cleanClause || "...", font: "Georgia" }),
                                ],
                            })
                        ];
                    }),

                    // NOW THEREFORE
                    new Paragraph({
                        alignment: AlignmentType.BOTH,
                        spacing: { before: 400, after: 200 },
                        children: [
                            new TextRun({ text: "NOW THEREFORE, ", bold: true, font: "Georgia" }),
                            new TextRun({ text: `on motion of ${data.movant_name || "[MOVANT]"} duly seconded by ${data.seconder_name || "[SECONDER]"}, be it:`, font: "Georgia" }),
                        ],
                    }),

                    // RESOLVED Clauses
                    ...data.resolvedClauses.flatMap((clause) => {
                        const cleanClause = clause.replace(/^(RESOLVED,?\s*(as it is hereby resolved,?)?\s*)/i, "").trim();
                        return [
                            new Paragraph({
                                alignment: AlignmentType.BOTH,
                                spacing: { after: 200 },
                                children: [
                                    new TextRun({ text: "RESOLVED, ", bold: true, font: "Georgia" }),
                                    new TextRun({ text: "as it is hereby resolved, ", font: "Georgia" }),
                                    new TextRun({ text: cleanClause || "...", font: "Georgia" }),
                                ],
                            })
                        ];
                    }),

                    // Footer text
                    new Paragraph({ spacing: { before: 600 } }),
                    ...(data.footer_approved_text ? [
                        new Paragraph({
                            children: [new TextRun({ text: data.footer_approved_text, font: "Georgia" })],
                            spacing: { after: 200 }
                        })
                    ] : []),

                    ...(data.approvedOn ? [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: data.footer_adopted_text || `Adopted this ${new Date(data.approvedOn).toLocaleDateString('en-US', { day: 'numeric' })}th day of ${new Date(data.approvedOn).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} at ${orgSettings?.address ? orgSettings.address.split(',').slice(-2).join(',').trim() : '_____________________'}.`,
                                    font: "Georgia"
                                })
                            ],
                            spacing: { after: 400 }
                        })
                    ] : []),

                    // Signatories Certified Text
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: data.footer_certified_text || "We hereby certify to the correctness of the foregoing resolution.",
                                font: "Georgia"
                            })
                        ],
                        spacing: { before: 400, after: 600 }
                    }),

                    // Signatories Grid Implementation
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.NONE },
                            bottom: { style: BorderStyle.NONE },
                            left: { style: BorderStyle.NONE },
                            right: { style: BorderStyle.NONE },
                            insideHorizontal: { style: BorderStyle.NONE },
                            insideVertical: { style: BorderStyle.NONE },
                        },
                        rows: createSignatoryRows(data.signatories, signatureImages),
                    }),
                ],
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Resolution-${data.resolutionNumber || "Draft"}.docx`);
}

function createSignatoryRows(signatories: Signatory[], signatureImages: Record<number, ImageRun>) {
    const rows: TableRow[] = [];

    // Chairman Centered Row
    const chairmanIndex = signatories.findIndex(s => s.role === 'chairman');
    if (chairmanIndex !== -1) {
        const chairman = signatories[chairmanIndex];
        const chairmanName = chairman.role !== 'gm' && !chairman.name.toUpperCase().startsWith('DIR.') ? `DIR. ${chairman.name}` : chairman.name;

        const cellChildren: Paragraph[] = [];
        if (signatureImages[chairmanIndex]) {
            cellChildren.push(new Paragraph({ children: [signatureImages[chairmanIndex]], alignment: AlignmentType.CENTER }));
        }
        cellChildren.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({ text: chairmanName, bold: true, allCaps: true, font: "Georgia", underline: {} }),
                new TextRun({ text: `\n${chairman.position}`, italics: true, size: 18, font: "Georgia" }),
            ],
            spacing: { before: signatureImages[chairmanIndex] ? 0 : 400, after: 600 }
        }));

        rows.push(new TableRow({
            children: [
                new TableCell({
                    columnSpan: 2,
                    children: cellChildren
                })
            ]
        }));
    }

    // Others in 2-column grid
    const remainingIndices = signatories
        .map((s, i) => ({ s, i }))
        .filter(item => ['member', 'vice-chairman', 'secretary'].includes(item.s.role));

    for (let i = 0; i < remainingIndices.length; i += 2) {
        const leftItem = remainingIndices[i];
        const rightItem = remainingIndices[i + 1];

        const leftChildren: Paragraph[] = [];
        if (signatureImages[leftItem.i]) {
            leftChildren.push(new Paragraph({ children: [signatureImages[leftItem.i]], alignment: AlignmentType.CENTER }));
        }
        const leftName = leftItem.s.role !== 'gm' && !leftItem.s.name.toUpperCase().startsWith('DIR.') ? `DIR. ${leftItem.s.name}` : leftItem.s.name;
        leftChildren.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({ text: leftName, bold: true, allCaps: true, font: "Georgia", underline: {} }),
                new TextRun({ text: `\n${leftItem.s.position}`, italics: true, size: 18, font: "Georgia" }),
            ],
            spacing: { before: signatureImages[leftItem.i] ? 0 : 200, after: 400 }
        }));

        const rightChildren: Paragraph[] = [];
        if (rightItem) {
            if (signatureImages[rightItem.i]) {
                rightChildren.push(new Paragraph({ children: [signatureImages[rightItem.i]], alignment: AlignmentType.CENTER }));
            }
            const rightName = rightItem.s.role !== 'gm' && !rightItem.s.name.toUpperCase().startsWith('DIR.') ? `DIR. ${rightItem.s.name}` : rightItem.s.name;
            rightChildren.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({ text: rightName, bold: true, allCaps: true, font: "Georgia", underline: {} }),
                    new TextRun({ text: `\n${rightItem.s.position}`, italics: true, size: 18, font: "Georgia" }),
                ],
                spacing: { before: signatureImages[rightItem.i] ? 0 : 200, after: 400 }
            }));
        }

        rows.push(new TableRow({
            children: [
                new TableCell({ children: leftChildren }),
                new TableCell({ children: rightChildren })
            ]
        }));
    }

    // GM Concurred
    const gmIndex = signatories.findIndex(s => s.role === 'gm');
    if (gmIndex !== -1) {
        const gm = signatories[gmIndex];
        const gmChildren: Paragraph[] = [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Concurred:", font: "Georgia" })],
                spacing: { before: 400 }
            })
        ];

        if (signatureImages[gmIndex]) {
            gmChildren.push(new Paragraph({ children: [signatureImages[gmIndex]], alignment: AlignmentType.CENTER }));
        }

        gmChildren.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({ text: gm.name, bold: true, allCaps: true, font: "Georgia", underline: {} }),
                new TextRun({ text: `\n${gm.position}`, italics: true, size: 18, font: "Georgia" }),
            ],
            spacing: { before: signatureImages[gmIndex] ? 0 : 200, after: 400 }
        }));

        rows.push(new TableRow({
            children: [
                new TableCell({
                    columnSpan: 2,
                    children: gmChildren
                })
            ]
        }));
    }

    return rows;
}
