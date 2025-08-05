import { NextRequest, NextResponse } from "next/server";

interface vercelAIModel {
    name: string
    slug: string
    imageInput: boolean
    objectGeneration: boolean
    toolUsage: boolean
}

interface vercelAIProvider {
    name: string
    models: vercelAIModel[]
    imageInput: boolean
    objectGeneration: boolean
    toolUsage: boolean
    toolStreaming: boolean
}

interface model {
    name: string
    slug: string
    imageInput: boolean
    objectGeneration: boolean
    toolUsage: boolean
    toolStreaming: boolean
    textGeneration: boolean
    imageGeneration: boolean
    embeddingGeneration: boolean
    audioGeneration: boolean
    videoGeneration: boolean
    settings: {
        responseSize: number | null
        contextSize: number | null
        contextSizeMax: number | null
    }
}

interface provider {
    API: "Text completion" | "Chat completion" | "NovelAI" | "AI Horde" | "KoboldAI classic"
    name: string
    modelFamily: {
        name: string
        models: model[]
    }[]
    sampler: {
        // Basic parameters
        temperature: number | null
        temperatureLast: boolean | null
        maxTemp: number | null
        minTemp: number | null
        dynatemp_block: number | null
        dynatempExponent: number | null
        
        // Top sampling
        topK: number | null
        topP: number | null
        topA: number | null
        minP: number | null
        typicalP: number | null
        
        // Repetition penalty
        repetitionPenaltyRange: number | null
        repetitionPenaltySlope: number | null
        freqPen: number | null
        presencePen: number | null
        
        // Advanced sampling
        TFS: number | null
        epsilonCutoff: number | null
        etaCutoff: number | null
        smoothingFactor: boolean | null
        
        // Mirostat
        mirostat: number | null
        mirostatEta: number | null
        mirostatTau: number | null
        
        // DRY
        DRYrepetitionPenalty: number | null
        dryAllowedLength: number | null
        drySequenceBreakers: string | null
        dryBase: number | null
        dryPenaltyLastN: number | null
        
        // XTC and other blocks
        XTC: number | null
        xtcThreshold: number | null
        
        // Beam search and sampling controls
        beamSearch: boolean | null
        topnsigma: number | null
        seed: number | null
        skew: number | null
        
        // Token controls
        bannedTokens: string[] | null
        globalBannedTokens: string[] | null
        skipSpecialTokens: boolean | null
        
        // Grammar and constraints
        grammarBlock: boolean | null
        jsonSchemaBlock: boolean | null
        
        // Output controls
        maxTokensSecond: number | null
        minLength: number | null
        noRepeatNgramSize: number | null
        repPen: number | null
        repPenRange: number | null
        
        // Sampling methods
        doSample: boolean | null
        earlyStopping: boolean | null
        ignoreEosToken: boolean | null
        logitBias: object | null
        
        // Additional blocks and features
        CFGBlock: boolean | null
        includeReasoning: boolean | null
        lengthPenalty: number | null
        negativePrompt: string | null
        openrouterAllowFallbacks: boolean | null
        sendBannedTokens: boolean | null
        speculativeNgram: number | null
        spacesBetweenSpecialTokens: boolean | null
        
        // Dynamic controls
        dynamicTemperature: boolean | null
        DynaTemp: boolean | null
        
        // Sampler priority blocks
        OobaSamplerPriorityBlock: boolean | null
        AphroditeSamplerPriorityBlock: boolean | null
        
        // Search blocks
        BeamSearchBlock: boolean | null
        ContrastSearchBlock: boolean | null
        
        // Other specialized samplers
        addBosToken: boolean | null
        banEosToken: boolean | null
        encoderRepPen: number | null
        extensions: boolean | null
        genericModel: boolean | null
        KCPPSamplerOrderBlock: boolean | null
        LCPPSamplerOrderBlock: boolean | null
        minKeep: number | null
        MirostatBlock: boolean | null
        n: number | null
        temp: number | null
        smoothingCurve: boolean | null
    }

}

const defaults: provider = {
    API: "Chat completion",
    name: "OpenAI",
    modelFamily: [{
        name: "gpt",
        models: []
    }],
    sampler: {
        // Basic parameters
        temperature: null,
        temperatureLast: null,
        maxTemp: null,
        minTemp: null,
        dynatemp_block: null,
        dynatempExponent: null,
        
        // Top sampling
        topK: null,
        topP: null,
        topA: null,
        minP: null,
        typicalP: null,
        
        // Repetition penalty
        repetitionPenaltyRange: null,
        repetitionPenaltySlope: null,
        freqPen: null,
        presencePen: null,
        
        // Advanced sampling
        TFS: null,
        epsilonCutoff: null,
        etaCutoff: null,
        smoothingFactor: null,
        
        // Mirostat
        mirostat: null,
        mirostatEta: null,
        mirostatTau: null,
        
        // DRY
        DRYrepetitionPenalty: null,
        dryAllowedLength: null,
        drySequenceBreakers: null,
        dryBase: null,
        dryPenaltyLastN: null,
        
        // XTC and other blocks
        XTC: null,
        xtcThreshold: null,
        
        // Beam search and sampling controls
        beamSearch: null,
        topnsigma: null,
        seed: null,
        skew: null,
        
        // Token controls
        bannedTokens: null,
        globalBannedTokens: null,
        skipSpecialTokens: null,
        
        // Grammar and constraints
        grammarBlock: null,
        jsonSchemaBlock: null,
        
        // Output controls
        maxTokensSecond: null,
        minLength: null,
        noRepeatNgramSize: null,
        repPen: null,
        repPenRange: null,
        
        // Sampling methods
        doSample: null,
        earlyStopping: null,
        ignoreEosToken: null,
        logitBias: null,
        
        // Additional blocks and features
        CFGBlock: null,
        includeReasoning: null,
        lengthPenalty: null,
        negativePrompt: null,
        openrouterAllowFallbacks: null,
        sendBannedTokens: null,
        speculativeNgram: null,
        spacesBetweenSpecialTokens: null,
        
        // Dynamic controls
        dynamicTemperature: null,
        DynaTemp: null,
        
        // Sampler priority blocks
        OobaSamplerPriorityBlock: null,
        AphroditeSamplerPriorityBlock: null,
        
        // Search blocks
        BeamSearchBlock: null,
        ContrastSearchBlock: null,
        
        // Other specialized samplers
        addBosToken: null,
        banEosToken: null,
        encoderRepPen: null,
        extensions: null,
        genericModel: null,
        KCPPSamplerOrderBlock: null,
        LCPPSamplerOrderBlock: null,
        minKeep: null,
        MirostatBlock: null,
        n: null,
        temp: null,
        smoothingCurve: null,
    }
}

const openai: provider = {
    API: "Chat completion",
    name: "OpenAI",
    modelFamily: [{
        name: "gpt",
        models: [
            {
                name: "gpt-4o",
                slug: "gpt-4o",
                imageInput: false,
                objectGeneration: false,
                toolUsage: false,
                toolStreaming: false,
                textGeneration: true,
                imageGeneration: false,
                embeddingGeneration: false,
                audioGeneration: false,
                videoGeneration: false,
                settings: {
                    responseSize: 1024,
                    contextSize: 1024,
                    contextSizeMax: 1024
                }
            }
        ]
    }],
    sampler: {
        ...defaults.sampler,
        temperature: 1,
        temperatureLast: false,
        maxTemp: 1.2,
        minTemp: 0.7,
        dynatemp_block: 0.7,
    }
}

export async function GET(request: NextRequest) {
    return Response.json({ok: true}, {status: 200})
}