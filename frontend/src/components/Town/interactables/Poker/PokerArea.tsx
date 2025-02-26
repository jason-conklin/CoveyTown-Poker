import {
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Button,
  useToast,
  Container,
  List,
  ListItem,
  Text,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PokerAreaController from '../../../../classes/interactable/PokerAreaController';
import { useInteractable, useInteractableAreaController } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import { GameStatus, InteractableID } from '../../../../types/CoveyTownSocket';
import GameAreaInteractable from '../GameArea';
import Leaderboard from '../Leaderboard';
import PokerTable from './PokerTable';

/**
 * The PokerArea component renders the Poker game area.
 */
function PokerArea({ interactableID }: { interactableID: InteractableID }): JSX.Element {
  const gameAreaController = useInteractableAreaController<PokerAreaController>(interactableID);
  const [joining, setJoining] = useState(false);
  const [gameStatus, setGameStatus] = useState<GameStatus>(gameAreaController.status);
  const [currentPlayer, setCurrentPlayer] = useState(gameAreaController.whoseTurn);
  const [currentBet, setCurrentBet] = useState(gameAreaController.currentBet);
  const [pot, setPot] = useState(gameAreaController.pot);
  const [sidepot, setSidePot] = useState(gameAreaController.sidepot);
  const [observers, setObservers] = useState(gameAreaController.observers);
  const [history, setHistory] = useState(gameAreaController.history);
  const townController = useTownController();
  const [leaving, setLeaving] = useState(false);
  const toast = useToast();
  const [bets, setBets] = useState(gameAreaController.bets);
  const [cases, setCase] = useState(gameAreaController.case);
  const handleJoin = useCallback(async () => {
    setJoining(true);
    try {
      await gameAreaController.joinGame();
    } catch (err) {
      toast({
        title: 'Failed to join game',
        description: (err as Error).toString(),
        status: 'error',
        isClosable: true,
      });
    } finally {
      setJoining(false);
    }
  }, [gameAreaController, toast]);

  const handleLeave = useCallback(async () => {
    setLeaving(true);
    try {
      await gameAreaController.leaveGame();
    } catch (err) {
      toast({
        title: 'Failed to leave game',
        description: (err as Error).toString(),
        status: 'error',
        isClosable: true,
      });
    } finally {
      setJoining(false);
    }
  }, [gameAreaController, toast]);

  const handleStartGame = useCallback(async () => {
    setGameStatus('IN_PROGRESS');
    try {
      await gameAreaController.startGame();
    } catch (err) {
      toast({
        title: 'Failed to start game',
        description: (err as Error).toString(),
        status: 'error',
        isClosable: true,
      });
    }
  }, [gameAreaController, toast]);

  const handleUpdate = useCallback(() => {
    setGameStatus(gameAreaController.status);
    setCurrentPlayer(gameAreaController.whoseTurn);
    setPot(gameAreaController.pot);
    setObservers(gameAreaController.observers);
    setHistory(gameAreaController.history);
    setCurrentBet(gameAreaController.currentBet);
    setBets(gameAreaController.bets);
    setSidePot(gameAreaController.sidepot);
    setCase(gameAreaController.case);
  }, [gameAreaController]);

  const handleEndGame = useCallback(() => {
    let resultMessage;
    if (gameAreaController.winner) {
      if (gameAreaController.winner === townController.ourPlayer) {
        if (cases === 'SHOWDOWN') {
          resultMessage = 'YOU WON THE ROUND';
        } else {
          resultMessage = 'You won the game!';
        }
      } else {
        resultMessage = 'You lost';
      }
    }
    toast({
      title: `Game over: ${resultMessage || 'TIE'}`,
      status: 'info',
      description: 'The Poker game has ended.',
      isClosable: true,
    });
  }, [toast, townController.ourPlayer, gameAreaController.winner, cases]);

  useEffect(() => {
    handleUpdate();
    gameAreaController.addListener('gameUpdated', handleUpdate);
    gameAreaController.addListener('gameEnd', handleEndGame);
    gameAreaController.addListener('gameStart', handleStartGame);
    return () => {
      gameAreaController.removeListener('gameEnd', handleEndGame);
      gameAreaController.removeListener('gameUpdated', handleUpdate);
      gameAreaController.removeListener('gameStart', handleStartGame);
    };
  }, [gameAreaController, handleUpdate, handleEndGame, handleStartGame]);

  useEffect(() => {
    if (gameStatus === 'OVER' || cases === 'SHOWDOWN') {
      handleEndGame();
    }
  }, [gameStatus, handleEndGame, cases]);

  const joinGameButton = useMemo(() => {
    if (gameStatus === 'WAITING_TO_START' && !gameAreaController.isPlayer) {
      return (
        <Button
          onClick={handleJoin}
          isLoading={joining}
          loadingText='Joining'
          disabled={joining}
          colorScheme='blue'>
          Join New Game
        </Button>
      );
    }
    return null;
  }, [gameStatus, joining, handleJoin, gameAreaController.isPlayer]);

  const leaveGameButton = useMemo(() => {
    if (gameStatus === 'OVER' && gameAreaController.isPlayer) {
      return (
        <Button
          onClick={handleLeave}
          isLoading={leaving}
          loadingText='Leaving'
          disabled={leaving}
          colorScheme='blue'>
          Leave Game
        </Button>
      );
    }
    return null;
  }, [gameStatus, handleLeave, gameAreaController.isPlayer, leaving]);

  const startGameButton = useMemo(() => {
    if (
      gameAreaController.players[0] === townController.ourPlayer &&
      gameStatus === 'WAITING_TO_START'
    ) {
      return (
        <Button
          onClick={handleStartGame}
          isLoading={joining}
          loadingText='Joining'
          disabled={gameAreaController.players.length < 3}
          colorScheme='blue'>
          Start the Game
        </Button>
      );
    }
  }, [gameStatus, gameAreaController.players, townController.ourPlayer, joining, handleStartGame]);

  const statusMessage = useMemo(() => {
    if (gameStatus === 'IN_PROGRESS') {
      if (gameAreaController.isOurTurn) {
        return <>Game in progress: It is your turn to act.</>;
      } else {
        return (
          <>Game in progress: Waiting for {currentPlayer?.userName || 'another player'} to act.</>
        );
      }
    } else if (gameStatus === 'WAITING_TO_START') {
      return <>Game not yet started.</>;
    } else {
      return <>Game over.</>;
    }
  }, [gameStatus, currentPlayer, gameAreaController.isOurTurn]);

  const playerPositions = useMemo(() => {
    const positions = ['Player1', 'Player2', 'Player3', 'Player4', 'Player5', 'Player6']; // Define table positions
    return gameAreaController.players.map((player, index) => ({
      name: player.userName,
      position: positions[index] || `Player${index + 1}`, // Fallback to avoid out-of-range
      id: player.id || `player${index + 1}`, // Ensure each player has an id
    }));
  }, [gameAreaController.players]);

  return (
    <Container
      display='flex'
      flexDirection='column'
      alignItems='flex-start' // Align items to the left
      justifyContent='flex-start' // Align content to the top if needed
      padding={0} // Remove padding
      margin={0} // Remove any margin
      width='100%' // Ensure the container spans the modal width
    >
      <Text>{statusMessage}</Text>
      {joinGameButton}
      {startGameButton}
      {leaveGameButton}
      <List aria-label='list of players in the game'>
        {gameAreaController.players.map((player, index) => (
          <ListItem key={index}>
            Player {index + 1}: {player.userName}
          </ListItem>
        ))}
      </List>
      <PokerTable
        pokerGameController={gameAreaController}
        pot={pot}
        currentBet={currentBet}
        chips={gameAreaController.chips[townController.ourPlayer.id] || 0}
        currentBetAmount={gameAreaController.bets[townController.ourPlayer.id] || 0}
        players={playerPositions} // Pass the mapped players to the PokerTable
        sidePot={sidepot}
        bets={bets}
        chip={gameAreaController.chips}
      />

      <Leaderboard results={history} />
      <List aria-label='list of observers in the game'>
        {observers.length > 0 ? (
          observers.map((observer, index) => <ListItem key={index}>{observer.userName}</ListItem>)
        ) : (
          <ListItem>No Observers</ListItem>
        )}
      </List>
    </Container>
  );
}

/**
 * A wrapper component for the PokerArea component.
 */
export default function PokerAreaWrapper(): JSX.Element {
  const gameArea = useInteractable<GameAreaInteractable>('gameArea');
  const townController = useTownController();
  const closeModal = useCallback(() => {
    if (gameArea) {
      townController.interactEnd(gameArea);
      const controller = townController.getGameAreaController(gameArea);
      controller.leaveGame();
    }
  }, [townController, gameArea]);

  if (gameArea && gameArea.getData('type') === 'Poker') {
    return (
      <Modal isOpen={true} onClose={closeModal} closeOnOverlayClick={false}>
        <ModalOverlay />
        <ModalContent
          maxWidth='840px'
          display='flex'
          alignItems='flex-start' // Align content to the top-left
          justifyContent='flex-start' // Ensure left alignment
          padding='20px' // Add a small padding (adjust as needed)
          margin={0} // Ensure no additional margin
          width='100%'>
          <ModalHeader>{gameArea.name}</ModalHeader>
          <ModalCloseButton />
          <PokerArea interactableID={gameArea.name} />
        </ModalContent>
      </Modal>
    );
  }
  return <></>;
}
