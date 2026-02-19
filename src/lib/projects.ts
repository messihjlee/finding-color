export interface Publication {
  title: string;
  authors: string;
  year: number;
  venue: string;
  doi?: string;
  arxiv?: string;
  abstract: string;
  selected: boolean;
}

export const publications: Publication[] = [
  {
    title: "Implicit Bias-Like Patterns in Reasoning Models",
    authors: "Lee, Messi H. J. and Lai, Calvin K.",
    year: 2025,
    venue: "arXiv",
    doi: "10.48550/arXiv.2503.11572",
    arxiv: "2503.11572",
    abstract:
      "Implicit biases refer to automatic mental processes that shape perceptions, judgments, and behaviors. We present the Reasoning Model Implicit Association Test (RM-IAT) to study implicit bias-like processing in reasoning models. Using RM-IAT, we find that reasoning models consistently expend more reasoning tokens on association-incompatible tasks than association-compatible tasks, suggesting greater computational effort when processing counter-stereotypical information.",
    selected: true,
  },
  {
    title:
      "Demographic Biases in Political Ideology Attribution by Vision-Language Models",
    authors:
      "Jeon, Soyeon and Lee, Messi H.J. and Montgomery, Jacob M. and Lai, Calvin K.",
    year: 2025,
    venue: "Preprint",
    abstract:
      "When foundation models analyze political content, do they use demographic characteristics as shortcuts for ideological attribution? We conducted detailed experiments with GPT-4o-mini and validated key findings across GPT-4o and LLaVA. All models consistently attributed more liberal ideologies to women than men, with effects exceeding real-world gender differences.",
    selected: false,
  },
  {
    title:
      "Visual Cues of Gender and Race Are Associated with Stereotyping in Vision-Language Models",
    authors:
      "Lee, Messi H. J. and Jeon, Soyeon and Montgomery, Jacob M. and Lai, Calvin K.",
    year: 2025,
    venue: "arXiv",
    doi: "10.48550/arXiv.2503.05093",
    arxiv: "2503.05093",
    abstract:
      "Using standardized facial images that vary in prototypicality, we test four VLMs for both trait associations and homogeneity bias in open-ended contexts. We find that VLMs consistently generate more uniform stories for women compared to men, with people who are more gender prototypical in appearance being represented more uniformly.",
    selected: false,
  },
  {
    title:
      "Homogeneity Bias as Differential Sampling Uncertainty in Language Models",
    authors: "Lee, Messi H. J. and Jeon, Soyeon",
    year: 2025,
    venue: "arXiv",
    doi: "10.48550/arXiv.2501.19337",
    arxiv: "2501.19337",
    abstract:
      "We propose that homogeneity bias emerges from systematic differences in the probability distributions from which tokens are sampled at inference-time. Analyzing three measures of uncertainty, we find that in some models tokens are sampled more deterministically when generating texts about marginalized groups compared to dominant group counterparts.",
    selected: false,
  },
  {
    title:
      "Examining the Robustness of Homogeneity Bias to Hyperparameter Adjustments in GPT-4",
    authors: "Lee, Messi H. J.",
    year: 2025,
    venue: "arXiv",
    doi: "10.48550/arXiv.2501.02211",
    arxiv: "2501.02211",
    abstract:
      "We investigate how homogeneity bias responds to hyperparameter adjustments in GPT-4, specifically examining sampling temperature and top p. We find that homogeneity bias persists across most hyperparameter configurations and that hyperparameter adjustments affect racial and gender homogeneity bias differently.",
    selected: false,
  },
  {
    title:
      "Vision-Language Models Generate More Homogeneous Stories for Phenotypically Black Individuals",
    authors: "Lee, Messi H. J. and Jeon, Soyeon",
    year: 2025,
    venue: "arXiv",
    doi: "10.48550/arXiv.2412.09668",
    arxiv: "2412.09668",
    abstract:
      "This study investigates homogeneity bias within Black Americans, examining how perceived racial phenotypicality influences VLMs' outputs. Our findings reveal that VLMs generate significantly more homogeneous stories about Black individuals with higher phenotypicality compared to those with lower phenotypicality.",
    selected: true,
  },
  {
    title:
      "Probability of Differentiation Reveals Brittleness of Homogeneity Bias in Large Language Models",
    authors: "Lee, Messi H. J. and Lai, Calvin K.",
    year: 2024,
    venue: "arXiv",
    doi: "10.48550/arXiv.2407.07329",
    arxiv: "2407.07329",
    abstract:
      "We find that homogeneity bias is highly volatile across situation cues and writing prompts, suggesting that the bias observed in past work may reflect those within encoder models rather than LLMs. Furthermore, homogeneity bias in LLMs is brittle, as even minor and arbitrary changes in prompts can significantly alter the expression of biases.",
    selected: false,
  },
  {
    title:
      "Large Language Models Portray Socially Subordinate Groups as More Homogeneous, Consistent with a Bias Observed in Humans",
    authors: "Lee, Messi H.J. and Montgomery, Jacob M. and Lai, Calvin K.",
    year: 2024,
    venue: "FAccT '24",
    doi: "10.1145/3630106.3658975",
    abstract:
      "We investigate a new form of bias in LLMs that resembles a social psychological phenomenon where socially subordinate groups are perceived as more homogeneous than socially dominant groups. We consistently found that ChatGPT portrayed African, Asian, and Hispanic Americans as more homogeneous than White Americans.",
    selected: true,
  },
  {
    title:
      "America's Racial Framework of Superiority and Americanness Embedded in Natural Language",
    authors: "Lee, Messi H. J. and Montgomery, Jacob M. and Lai, Calvin K.",
    year: 2024,
    venue: "PNAS Nexus",
    doi: "10.1093/pnasnexus/pgad485",
    abstract:
      "We investigated America's racial framework in a corpus of spoken and written language using word embeddings. We found that America's racial framework is embedded in American English, with Asian people stereotyped as more American than Hispanic people.",
    selected: false,
  },
];
