import { chakra, Container, useToast, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import PokerAreaController from '../../../../classes/interactable/PokerAreaController';
import { Card, PokerMoveType } from '../../../../types/CoveyTownSocket';
import Image from 'next/image';
import useTownController from '../../../../hooks/useTownController';

export type PokerTableProps = {
  pokerGameController: PokerAreaController;
  pot: number;
  currentBet: number;
  chips: number;
  chip: { [id: string]: number };
  currentBetAmount: number;
  players: { name: string; position: string; id: string }[];
  sidePot?: number;
  bets: { [id: string]: number };
};

/**
 * Styled container for the Poker Table
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
const StyledPokerTable = chakra(Container, {
  baseStyle: {
    display: { base: 'none', md: 'block' },
    width: '800px',
    height: '600px',
    backgroundColor: 'darkgreen',
    border: '8px solid #5C4033',
    borderRadius: '10px',
    position: 'relative',
    maxWidth: '180ch',
  },
});

/**
 * A component that represents the Poker Table
 */
export default function PokerTable({
  pokerGameController,
  pot,
  currentBet,
  chips,
  currentBetAmount,
  players,
  sidePot,
  bets,
  chip,
}: PokerTableProps): JSX.Element {
  const toast = useToast();
  const [table, setTable] = useState<{
    communityCards: Card[];
    playerHands: Record<string, Card[]>;
  }>(pokerGameController.table);
  const townController = useTownController();
  const [ourTurn, setOurTurn] = useState(pokerGameController.isOurTurn);

  const handleAction = async (moveType: PokerMoveType, amount?: number) => {
    try {
      await pokerGameController.makeMove(moveType, amount);
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).toString(),
        status: 'error',
      });
    } finally {
      setOurTurn(pokerGameController.isOurTurn);
    }
  };

  useEffect(() => {
    const onTurnChanged = () => setOurTurn(pokerGameController.isOurTurn);
    const onTableChanged = () => setTable(pokerGameController.table);

    pokerGameController.addListener('turnChanged', onTurnChanged);
    pokerGameController.addListener('tableChanged', onTableChanged);

    return () => {
      pokerGameController.removeListener('turnChanged', onTurnChanged);
      pokerGameController.removeListener('tableChanged', onTableChanged);
    };
  }, [pokerGameController, pokerGameController.table]);

  // Generate player positions dynamically
  const playerPositions = [
    { top: '120px', right: '50%', transform: 'rotate(-90deg)' }, // Player 1
    { top: '10px', right: '30%' }, // Player 2
    { top: '10px', left: '30%' }, // Player 3
    { top: '120px', left: '60%', transform: 'rotate(-90deg)' }, // Player 4
    { bottom: '170px', right: '60%', transform: 'rotate(-90deg)' }, // Player 5
    { bottom: '170px', left: '60%', transform: 'rotate(-90deg)' }, // Player 6
  ];

  return (
    <StyledPokerTable aria-label='Poker Table'>
      {/* Winning Hand */}
      {pokerGameController.isRoundOver && (
        <Container
          position='absolute'
          top='120px' // Adjust to place it near the top center of the UI
          left='50%'
          transform='translateX(-50%)'
          display='flex'
          justifyContent='center'
          width='300px'
          alignItems='center'
          backgroundColor='rgba(0, 0, 0, 1)' // Semi-transparent black background
          padding='10px'
          borderRadius='5px'>
          <Text color='white' fontWeight='bold'>
            {pokerGameController.winner?.userName} won the game with:{' '}
            {pokerGameController.winningHand}!
          </Text>
        </Container>
      )}
      {/* Community Cards */}
      <Container
        display='flex'
        justifyContent='center'
        alignItems='center'
        position='absolute'
        top='45%'
        left='50%'
        transform='translate(-50%, -50%)'
        zIndex={10}
        gap='10px'>
        {table.communityCards.map((card, idx) => (
          <Image
            key={idx}
            src={`/assets/cards/${card.value}${card.suit[0].toUpperCase()}.png`}
            alt={`${card.value} of ${card.suit}`}
            width={55}
            height={83}
            style={{
              margin: '0 5px',
              borderRadius: '5px',
            }}
          />
        ))}
      </Container>

      {/* Pot Value Container */}
      <Container
        position='absolute'
        top='320px' // Adjust to place it near the top center of the UI
        left='50%'
        transform='translateX(-50%)'
        display='flex'
        justifyContent='center'
        width='120px'
        alignItems='center'
        backgroundColor='rgba(0, 0, 0, 0.5)' // Semi-transparent black background
        padding='10px'
        borderRadius='5px'>
        <Text color='white' fontWeight='bold'>
          Pot: ${pot}
        </Text>
      </Container>
      {sidePot && (
        <Container
          position='absolute'
          top='370px' // Adjust to place it near the top center of the UI
          left='50%'
          transform='translateX(-50%)'
          display='flex'
          justifyContent='center'
          width='150px'
          alignItems='center'
          backgroundColor='rgba(0, 0, 0, 0.5)' // Semi-transparent black background
          padding='10px'
          borderRadius='5px'>
          <Text color='white' fontWeight='bold'>
            Side Pot: ${sidePot}
          </Text>
        </Container>
      )}
      {/* Your Chips Container */}
      <Container
        width='160px'
        position='absolute'
        bottom='100px'
        left='10px'
        display='flex'
        justifyContent='center'
        alignItems='center'
        backgroundColor='rgba(0, 0, 0, 0.5)' // Semi-transparent black background
        padding='10px'
        borderRadius='5px'>
        <Text color='white' fontWeight='bold'>
          Your Chips: {chips}
        </Text>
      </Container>
      {/* Current Bet / Your Bet Container */}
      <Container
        width='180px'
        position='absolute'
        bottom='100px'
        right='10px'
        display='flex'
        flexDirection='column' // Stack the text vertically
        justifyContent='center'
        alignItems='flex-end'
        backgroundColor='rgba(0, 0, 0, 0.5)' // Semi-transparent black background
        padding='10px'
        borderRadius='5px'>
        <Text color='white' fontWeight='bold'>
          Current Bet: ${currentBet}
        </Text>
        <Text color='white' fontWeight='bold'>
          Your Bet: ${currentBetAmount}
        </Text>
      </Container>

      {/* Current Player's Cards */}
      <Container
        position='absolute'
        bottom='30px'
        left='50%'
        transform='translateX(-50%)'
        display='flex'
        flexDirection='column'
        justifyContent='center'
        alignItems='center'>
        <p style={{ color: 'white', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
          YOUR CARDS
        </p>
        <Container display='flex' justifyContent='center'>
          {pokerGameController.ourCards &&
            pokerGameController.ourCards.map((card, idx) => (
              <Image
                key={idx}
                src={`/assets/cards/${card.value}${card.suit[0].toUpperCase()}.png`}
                alt={`Card ${idx + 1}`}
                width={55}
                height={83}
                style={{ margin: '0 5px', borderRadius: '5px' }}
              />
            ))}
        </Container>
      </Container>

      {/* Other Players' Cards */}
      {players.map((player, index) => {
        const isCurrentPlayer = pokerGameController.currentPlayerName === player.name; // Check if this is "our" player
        const playerCards = pokerGameController.table.playerHands[player.name] || []; // Get this player's cards

        // Skip rendering the current player's cards in this section
        if (isCurrentPlayer) return null;

        const position = playerPositions[index]; // Get the position for this player

        return (
          <Container
            key={`Player-${index + 1}`}
            position='absolute'
            {...position}
            display='flex'
            flexDirection='column'
            justifyContent='center'
            alignItems='center'>
            {/* Card Images */}
            <Container display='flex' justifyContent='center'>
              {pokerGameController.isRoundOver
                ? playerCards.map((card, idx) => (
                    <Image
                      key={idx}
                      src={`/assets/cards/${card.value}${card.suit[0].toUpperCase()}.png`} // Revealed card
                      alt={`${card.value} of ${card.suit}`}
                      width={50} // Match the dimensions of face-down cards
                      height={75}
                      style={{
                        margin: '5px',
                        borderRadius: '5px',
                      }}
                    />
                  ))
                : ['faceDown.png', 'faceDown.png'].map((_, idx) => (
                    <Image
                      key={idx}
                      src={`/assets/cards/faceDown.png`} // Face-down card
                      alt={`Face Down Card ${idx + 1}`}
                      width={50}
                      height={75}
                      style={{
                        margin: '5px',
                        borderRadius: '5px',
                      }}
                    />
                  ))}
            </Container>

            {/* Player Tag */}
            <p
              style={{
                color: 'white',
                marginTop: '5px',
                fontSize: '14px',
                fontWeight: 'bold',
              }}>
              {player.name}
            </p>
            <p
              style={{
                color: 'white',
                marginTop: '5px',
                fontSize: '14px',
                fontWeight: 'bold',
              }}>
              BET: {bets[player.id]}
            </p>
            <p
              style={{
                color: 'white',
                marginTop: '5px',
                fontSize: '14px',
                fontWeight: 'bold',
              }}>
              chips: {chip[player.id]}
            </p>
          </Container>
        );
      })}

      {/* Conditional Rendering for All Players' Cards after the Round */}
      {pokerGameController.isRoundOver &&
        players.map((player, index) => {
          const isCurrentPlayer = pokerGameController.currentPlayerName === player.name; // Check if this is the current player
          if (isCurrentPlayer) {
            return null; // Skip rendering the current player's cards
          }
          const playerCards = pokerGameController.table.playerHands[player.id] || []; // Fetch player's cards
          const position = playerPositions[index]; // Fetch player-specific position

          return (
            <Container
              key={player.id}
              position='absolute'
              {...position} // Dynamically apply the position
              display='flex'
              flexDirection='column'
              justifyContent='center'
              alignItems='center'>
              {/* Render Cards */}
              <Container display='flex' justifyContent='center'>
                {playerCards.length === 0 ? (
                  <p style={{ color: 'red', fontWeight: 'bold' }}>No Cards</p>
                ) : (
                  playerCards.map((card, idx) => (
                    <Image
                      key={idx}
                      src={`/assets/cards/${card.value}${card.suit[0].toUpperCase()}.png`} // Render the actual card
                      alt={`Card ${idx + 1}`}
                      width={50}
                      height={75}
                      style={{
                        margin: '5px',
                        borderRadius: '5px',
                      }}
                    />
                  ))
                )}
              </Container>

              {/* Player Tag */}
              <p
                style={{
                  color: 'white', // Display player's name in white (no "YOUR CARDS" highlight)
                  marginTop: '5px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}>
                {player.name}
              </p>
            </Container>
          );
        })}

      {/* Action Buttons */}
      {ourTurn && (
        <Container
          display='flex'
          justifyContent='flex-end'
          alignItems='center'
          position='absolute'
          bottom='7px'
          right='6px'>
          <button
            style={{
              padding: '10px 20px',
              margin: '10px 10px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#1E3A8A',
              color: 'white',
              cursor: 'pointer',
            }}
            disabled={currentBetAmount > 0}
            onClick={() => handleAction('CHECK')}>
            Check
          </button>
          <button
            style={{
              padding: '10px 20px',
              margin: '0 10px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#1E3A8A',
              color: 'white',
              cursor: 'pointer',
            }}
            disabled={currentBet > chips}
            onClick={() => handleAction('BET', currentBet)}>
            Bet
          </button>
          <button
            style={{
              padding: '10px 20px',
              margin: '0 10px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#1E3A8A',
              color: 'white',
              cursor: 'pointer',
            }}
            onClick={() => handleAction('FOLD')}>
            Fold
          </button>
        </Container>
      )}
      {ourTurn && (
        <Container
          display='flex'
          justifyContent='flex-end'
          alignItems='center'
          position='absolute'
          bottom='15px'
          right='425px'>
          <button
            style={{
              padding: '10px 20px',
              margin: '0 10px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#1E3A8A',
              color: 'white',
              cursor: 'pointer',
            }}
            disabled={currentBet > chips}
            onClick={() => handleAction('BET', currentBet * 2)}>
            RAISE 2x
          </button>
          <button
            style={{
              padding: '10px 15px',
              margin: '0 10px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#1E3A8A',
              color: 'white',
              cursor: 'pointer',
            }}
            disabled={currentBet > chips}
            onClick={() => handleAction('BET', currentBet * 3)}>
            RAISE 3x
          </button>
          <button
            style={{
              padding: '10px 20px',
              margin: '0 10px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#1E3A8A',
              color: 'white',
              cursor: 'pointer',
            }}
            onClick={() =>
              handleAction('BET', pokerGameController.chips[townController.ourPlayer.id])
            }>
            ALL IN
          </button>
        </Container>
      )}
    </StyledPokerTable>
  );
}
