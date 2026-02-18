
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
        <div className="w-[8.5in] min-h-[13in] bg-white shadow-lg p-[1in] text-[12pt] font-serif leading-relaxed text-black print:shadow-none print:p-0 print:m-0 print:w-full">
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
                    /* Ensure all parent containers don't clip */
                    html, body, #__next, div[class*="overflow-hidden"], div[class*="overflow-y-auto"] {
                        overflow: visible !important;
                        height: auto !important;
                        max-height: none !important;
                        position: static !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-container {
                        width: 8.5in !important;
                        min-height: 13in !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }
                }
            ` }} />
            {/* Header Placeholders */}
            <div className="print-container">
                {/* Header */}
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
                                    className="w-24 h-24 object-contain"
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
                        on motion duly seconded, be it:
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

                <div className="mt-16">
                    <p className="mb-8">
                        UNANIMOUSLY APPROVED.
                    </p>
                    {data.approvedOn && (
                        <p className="mb-8">
                            ADOPTED this {new Date(data.approvedOn).toLocaleDateString('en-US', { day: 'numeric' })}th day of {new Date(data.approvedOn).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} at {orgSettings?.address ? orgSettings.address.split(',').slice(-2).join(',').trim() : "_____________________"}.
                        </p>
                    )}

                    {/* Signatories Section */}
                    {data.signatories && data.signatories.length > 0 ? (
                        <div className="mt-12 space-y-12 break-inside-avoid">
                            {/* 1. Chairman & Secretary (Top) usually certify */}
                            <div className="grid grid-cols-2 gap-8">
                                {data.signatories.filter(s => s?.role === 'secretary').map((signer, i) => (
                                    <div key={i} className="text-center">
                                        <p className="mb-8 text-left">I hereby certify to the correctness of the foregoing.</p>
                                        <div className="mt-4">
                                            <p className="font-bold uppercase tracking-wide border-b border-black inline-block min-w-[250px] mb-1">{signer.name}</p>
                                            <p className="text-sm italic">{signer.position}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <p className="mt-8 text-center uppercase font-bold text-sm tracking-widest">Attested by:</p>

                            {/* 2. Chairman centered */}
                            <div className="flex justify-center">
                                {data.signatories.filter(s => s?.role === 'chairman').map((signer, i) => (
                                    <div key={i} className="text-center">
                                        <div className="mt-4">
                                            <p className="font-bold uppercase tracking-wide border-b border-black inline-block min-w-[250px] mb-1">{signer.name}</p>
                                            <p className="text-sm italic">{signer.position}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 3. Members & Vice-Chairman centered/grid */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-12 mt-8">
                                {data.signatories.filter(s => s?.role === 'member' || s?.role === 'vice-chairman').map((signer, i) => (
                                    <div key={i} className="text-center">
                                        <div className="mt-4">
                                            <p className="font-bold uppercase tracking-wide border-b border-black inline-block min-w-[250px] mb-1">{signer.name}</p>
                                            <p className="text-sm italic">{signer.position}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 4. GM (Concurred?) centered */}
                            <div className="mt-12 flex justify-center">
                                {data.signatories.filter(s => s?.role === 'gm').map((signer, i) => (
                                    <div key={i} className="text-center">
                                        <p className="mb-4 text-left">Concurred:</p>
                                        <div className="mt-4">
                                            <p className="font-bold uppercase tracking-wide border-b border-black inline-block min-w-[250px] mb-1">{signer.name}</p>
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
        </div>
    )
}
