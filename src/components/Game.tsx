import React from "react";
import Food from "./Game/Food";
import Snake from "./Game/Snake";

interface AppProps {
    snakeDots: number[][],
    food: number[][]
    callback: Function
}

interface GameState {
    food: number[][],
    foodIndex: number,
    speed: number,
    pause: boolean,
    play: boolean,
    gameOver: String,
    direction: String,
    snakeDots: number[][]
    moves: number[]
    callback: Function
}

var initState: GameState;

class Game extends React.Component<AppProps, GameState> {

    constructor(props: any) {
        super(props);
        initState = {
            food: props.food,
            foodIndex: 0,
            speed: 1000,
            pause: false,
            play: false,
            gameOver: "",
            direction: 'RIGHT',
            snakeDots: props.snakeDots,
            moves: [],
            callback: props.callback
        }
        this.state = initState
    }

    componentDidMount(): void {
        setInterval(this.moveSnake, this.state.speed)
        document.onkeydown = this.onKeyDown;
    }

    componentDidUpdate(prevProps: Readonly<{}>, prevState: Readonly<{}>, snapshot?: any): void {
        this.checkIfOutOfBorders();
        this.checkIfCollapsed();
    }

    onKeyDown = (e: any) => {
        e = e || window.event;
        switch (e.keyCode) {
            case 38:
                this.setState({ direction: 'UP' });
                break;
            case 40:
                this.setState({ direction: 'DOWN' });
                break;
            case 37:
                this.setState({ direction: 'LEFT' });
                break;
            case 39:
                this.setState({ direction: 'RIGHT' });
                break;

        }
    }

    moveSnake = () => {

        if (!this.state.pause && this.state.play) {


            let dots: number[][] = [...this.state.snakeDots]
            let head: number[] = dots[dots.length - 1]
            var moves = this.state.moves

            switch (this.state.direction) {
                case 'RIGHT':
                    head = [Number(head[0]) + 1, head[1]]
                    moves.push(1)
                    break;
                case 'LEFT':
                    head = [Number(head[0]) - 1, head[1]]
                    moves.push(3)
                    break;
                case 'DOWN':
                    head = [head[0], Number(head[1]) - 1]
                    moves.push(2)
                    break;
                case 'UP':
                    head = [head[0], Number(head[1]) + 1]
                    moves.push(0)
                    break;
            }
            this.state.callback(moves[moves.length - 1])

            dots.push(head);


            //let head = this.state.snakeDots[this.state.snakeDots.length - 1];
            let currentFood = this.state.food[this.state.foodIndex];
            if (head[0] == currentFood[0] && head[1] == currentFood[1]) {
                if (this.state.foodIndex >= this.state.food.length - 1)
                    this.onWin()
                else
                    this.setState({
                        foodIndex: this.state.foodIndex + 1
                    })
            }
            else
                dots.shift();

            this.setState({
                snakeDots: dots,
                moves: moves
            })

        }
    }


    checkIfOutOfBorders() {
        let head = this.state.snakeDots[this.state.snakeDots.length - 1];
        if (head[0] >= 8 || head[1] >= 8 || head[0] < 0 || head[1] < 0) {
            this.onGameOver()
        }
    }

    checkIfCollapsed() {
        let snake = [...this.state.snakeDots];
        if (snake.length > 1) {
            let head = snake[snake.length - 1];
            snake.pop()
            snake.forEach(dot => {
                if (head[0] == dot[0] && head[1] == dot[1]) {
                    this.onGameOver();
                }
            })
        }
    }

    enlargeSnake() {
        let newSnake = [...this.state.snakeDots];
        newSnake.unshift([]);
        this.setState({
            snakeDots: newSnake
        })
    }

    increaseSpeed() {
        if (this.state.speed > 10) {
            this.setState({
                speed: this.state.speed - 10
            })
        }
    }

    onWin() {
        this.setState({
            food: initState.food,
            foodIndex: 0,
            speed: 1000,
            pause: false,
            play: false,
            gameOver: `No more food to eat`,
            direction: 'RIGHT',
            snakeDots: initState.snakeDots,
            moves: initState.moves
        });

        this.state.callback(undefined)
    }
    onGameOver() {
        this.setState({
            food: initState.food,
            foodIndex: 0,
            speed: 1000,
            pause: false,
            play: false,
            gameOver: `Game Over! Your Score was ${this.state.snakeDots.length} Try Again`,
            direction: 'RIGHT',
            snakeDots: initState.snakeDots,
            moves: initState.moves
        });

        this.state.callback(undefined)
    }

    render() {
        return (
            <div>
                <div className="flex my-2 justify-center">
                    <button className="rounded-md w-32 px-2 py-1 bg-slate-700 text-white" onClick={() => {
                        if (this.state.play) {
                            this.onGameOver()
                        } else this.setState({ play: true, gameOver: "" })
                    }}>{this.state.play ? "End Game" : "Play Game"}</button>
                    {this.state.play ?
                        <button className="ml-2 rounded-md w-32 px-2 py-1 bg-slate-700 text-white" onClick={() => {
                            this.setState({ pause: this.state.pause ? false : true })
                        }}>{this.state.pause ? "Return Game" : "Pause Game"}</button>
                        :
                        <></>
                    }
                </div>
                {
                    <div className={`game-area ${this.state.pause ? "bg-gray-500" : "bg-gray-200"} rounded-lg`}>
                        <Snake snakeDots={this.state.snakeDots} />
                        <Food dot={this.state.food[this.state.foodIndex]} />
                        <p>{this.state.gameOver}</p>

                    </div>
                }
            </div>
        )
    }
}

export default Game;