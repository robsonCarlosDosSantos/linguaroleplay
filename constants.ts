import { Scenario } from './types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'cafe',
    title: 'Cafeteria',
    description: 'Peça um café e um lanche como um local.',
    icon: '☕',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    initialPrompt: 'You are a friendly barista at a coffee shop in New York. The user is a customer. Start by welcoming them and asking what they would like to order.',
    difficulty: 'Easy',
  },
  {
    id: 'airport',
    title: 'Imigração',
    description: 'Responda às perguntas do oficial de imigração.',
    icon: '✈️',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    initialPrompt: 'You are a serious but polite US Immigration Officer. The user is a traveler arriving in the country. Ask for their passport and purpose of visit.',
    difficulty: 'Medium',
  },
  {
    id: 'interview',
    title: 'Entrevista de Emprego',
    description: 'Fale sobre suas qualidades e experiências.',
    icon: '💼',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    initialPrompt: 'You are a hiring manager for a tech company. The user is a candidate for a software developer role. Start by asking them to introduce themselves.',
    difficulty: 'Hard',
  },
  {
    id: 'party',
    title: 'Festa',
    description: 'Faça novos amigos em uma festa informal.',
    icon: '🎉',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    initialPrompt: 'You are a friendly guest at a house party. You see the user standing nearby and decide to strike up a conversation. Start with a casual greeting about the music or food.',
    difficulty: 'Easy',
  },
];
