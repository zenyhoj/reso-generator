
"use client"

import { ResolutionFormValues } from "@/types/schema"

interface LivePreviewProps {
    data: ResolutionFormValues
    orgSettings?: {
        water_district_name?: string
        address?: string
        logo_url?: string
        water_district_email?: string
        water_district_contact?: string
    }
}

export function LivePreview({ data, orgSettings }: LivePreviewProps) {
    return (
        <div className="w-[8.5in] bg-white shadow-lg p-[1in] text-[12pt] font-serif leading-relaxed text-black print:shadow-none print:border-0 print:p-0 print:m-0 print:w-full">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        size: 8.5in 13in;
                        margin: 1in;
                    }
                    body {
                        background: white !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    /* Reset all fixed/absolute/hidden containers to allow multi-page flow */
                    html, body, #__next, 
                    .fixed, .absolute,
                    div[class*="fixed"], div[class*="absolute"],
                    div[class*="overflow-hidden"], div[class*="overflow-y-auto"] {
                        position: static !important;
                        overflow: visible !important;
                        height: auto !important;
                        max-height: none !important;
                        min-height: 0 !important;
                        width: auto !important;
                        float: none !important;
                        display: block !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .preview-panel, .preview-wrapper {
                        overflow: visible !important;
                        height: auto !important;
                        position: static !important;
                        background: white !important;
                        padding: 0 !important;
                    }
                    body .no-print,
                    html .no-print,
                    div.no-print {
                        display: none !important;
                    }
                }
            ` }} />
            {/* Document Header */}
            <div className="flex items-center justify-center mb-6 relative">
                {/* Logo - Absolute positioned or flex? Flex is better for centering text if logo is side */}
                {/* User wants logo in header. Usually left side or top center. Let's try top center above text or left side. 
                    Standard Gov format is often Logo Left, Text Center, (Optional Logo Right).
                    Let's go with: Grid/Flex with Logo Left, Text Center.
                */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full">
                    <div className="flex justify-start">
                        {orgSettings?.logo_url && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={orgSettings.logo_url}
                                alt="Logo"
                                className="w-20 h-20 object-contain"
                                style={{ maxWidth: '80px', maxHeight: '80px' }}
                            />
                        )}
                    </div>

                    <div className="text-center space-y-1">
                        <p className="font-bold text-sm uppercase">Republic of the Philippines</p>
                        <p className="font-bold text-lg uppercase">{orgSettings?.water_district_name || "Water District Name"}</p>
                        <p className="text-sm">{orgSettings?.address || "City/Municipality, Province"}</p>
                        {(orgSettings?.water_district_email || orgSettings?.water_district_contact) && (
                            <p className="text-xs mt-1">
                                {orgSettings.water_district_email && `Email: ${orgSettings.water_district_email}`}
                                {orgSettings.water_district_email && orgSettings.water_district_contact && " | "}
                                {orgSettings.water_district_contact && `Contact Number: ${orgSettings.water_district_contact}`}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end">
                        {/* Empty div for balance if needed, or maybe right logo later */}
                    </div>
                </div>
            </div>

            <div className="text-center mb-8">
                <p className="mb-4">
                    EXCERPTS FROM THE MINUTES OF THE REGULAR MEETING OF THE BOARD OF DIRECTORS OF <span className="uppercase font-bold">{orgSettings?.water_district_name || "WATER DISTRICT NAME"}</span> HELD ON <span className="uppercase font-bold">{data.heldOn ? new Date(data.heldOn).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "[DATE]"}</span> AT THE BOARD ROOM.
                </p>

                <p className="font-bold text-lg uppercase tracking-wider mb-6">
                    Resolution No. {data.resolutionNumber || "___"}-Series of {data.seriesYear}
                </p>
            </div>

            <div className="font-bold text-center mb-10 uppercase text-lg leading-tight">
                "{data.title || "TITLE OF THE RESOLUTION"}"
            </div>

            <div className="space-y-6 text-justify">
                {data.whereasClauses?.map((clause, index) => {
                    const cleanClause = clause.replace(/^(WHEREAS,?\s*)/i, "").trim()
                    return (
                        <p key={index}>
                            <span className="font-bold mr-2">WHEREAS,</span>
                            {cleanClause || "..."}
                        </p>
                    )
                })}

                <p className="mt-8">
                    <span className="font-bold mr-2">NOW THEREFORE,</span>
                    on motion of {data.movant_name || "[MOVANT]"} duly seconded by {data.seconder_name || "[SECONDER]"}, be it:
                </p>

                {data.resolvedClauses?.map((clause, index) => {
                    const cleanClause = clause.replace(/^(RESOLVED,?\s*(as it is hereby resolved,?)?\s*)/i, "").trim()
                    return (
                        <p key={index}>
                            <span className="font-bold mr-2">RESOLVED,</span>
                            as it is hereby resolved, {cleanClause || "..."}
                        </p>
                    )
                })}
            </div>

            <div className="mt-16 text-left space-y-8">
                {(data.footer_approved_text ?? 'Unanimously approved.').trim() && (
                    <p>{data.footer_approved_text || 'Unanimously approved.'}</p>
                )}
                {data.approvedOn && (data.footer_adopted_text ?? '').trim() !== '\u200b' && (
                    <p>
                        {(data.footer_adopted_text ?? '').trim() || `Adopted this ${new Date(data.approvedOn).toLocaleDateString('en-US', { day: 'numeric' })}th day of ${new Date(data.approvedOn).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} at ${orgSettings?.address ? orgSettings.address.split(',').slice(-2).join(',').trim() : '_____________________'}.`}
                    </p>
                )}

                {/* Signatories Section */}
                {data.signatories && data.signatories.length > 0 ? (
                    <div className="space-y-12">
                        {(data.footer_certified_text ?? 'We hereby certify to the correctness of the foregoing resolution.').trim() && (
                            <p className="text-left">{data.footer_certified_text || 'We hereby certify to the correctness of the foregoing resolution.'}</p>
                        )}

                        {/* 2. Chairman centered */}
                        <div className="flex justify-center break-inside-avoid">
                            {data.signatories.filter(s => s?.role === 'chairman').map((signer, i) => (
                                <div key={i} className="text-center flex flex-col items-center relative">
                                    <div className="mt-4 relative flex flex-col items-center">
                                        {signer.signature && (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={signer.signature}
                                                alt="Signature"
                                                className="absolute -top-12 h-16 object-contain pointer-events-none z-10"
                                            />
                                        )}
                                        <p className="font-bold uppercase tracking-wide border-b border-black inline-block min-w-[250px] mb-1 relative z-0">{signer.name}</p>
                                        <p className="text-sm italic">{signer.position}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 3. Members, Vice-Chairman & Secretary grid */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-12 mt-8 break-inside-avoid">
                            {data.signatories
                                .filter(s => ['member', 'vice-chairman', 'secretary'].includes(s?.role))
                                .sort((a, b) => {
                                    const order = { 'vice-chairman': 1, 'secretary': 2, 'member': 3 }
                                    return (order[a.role as keyof typeof order] || 4) - (order[b.role as keyof typeof order] || 4)
                                })
                                .map((signer, i) => (
                                    <div key={i} className="text-center flex flex-col items-center relative">
                                        <div className={`${signer.role === 'secretary' ? '' : 'mt-auto'} relative flex flex-col items-center`}>
                                            {signer.signature && (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img
                                                    src={signer.signature}
                                                    alt="Signature"
                                                    className="absolute -top-12 h-16 object-contain pointer-events-none z-10"
                                                />
                                            )}
                                            <p className="font-bold uppercase tracking-wide border-b border-black inline-block min-w-[250px] mb-1 relative z-0">{signer.name}</p>
                                            <p className="text-sm italic">{signer.position}</p>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {/* 4. GM (Concurred?) centered */}
                        <div className="mt-12 flex justify-center break-inside-avoid">
                            {data.signatories.filter(s => s?.role === 'gm').map((signer, i) => (
                                <div key={i} className="text-center flex flex-col items-center relative">
                                    <p className="mb-4 text-center">Concurred:</p>
                                    <div className="mt-4 relative flex flex-col items-center">
                                        {signer.signature && (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={signer.signature}
                                                alt="Signature"
                                                className="absolute -top-12 h-16 object-contain pointer-events-none z-10"
                                            />
                                        )}
                                        <p className="font-bold uppercase tracking-wide border-b border-black inline-block min-w-[250px] mb-1 relative z-0">{signer.name}</p>
                                        <p className="text-sm italic">{signer.position}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="mt-12">
                        <p className="text-red-500 italic text-sm">[No signatories defined. Please configure Organization Settings.]</p>
                    </div>
                )}
            </div>
        </div>
    )
}
