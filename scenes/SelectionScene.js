import { me1 } from "../data/me1.js";

// Filter only Pokémon cards (excluding Trainer and Energy cards)
const POKEMON_SET = me1.filter(card => card.supertype === "Pokémon");

export default class SelectionScene extends Phaser.Scene {
    constructor() {
        super("SelectionScene");
    }

    preload() {
        // Load all Pokémon images
        POKEMON_SET.forEach(p => {
            this.load.image(p.id, p.images.small);
        });
    }

    create() {
        let pokelen = POKEMON_SET.length;
        
        // Title (fixed at top)
        this.add.text(50, 20, "Select your Pokémon (" + pokelen + " available)", {
            font: "32px Arial",
            fill: "#ffffff"
        }).setScrollFactor(0);

        // Grid configuration
        const startX = 150;
        const startY = 180;
        const cardWidth = 180;
        const cardHeight = 280;
        const columns = 5;
        
        let x = startX;
        let y = startY;
        let count = 0;

        for (const pokemon of POKEMON_SET) {
            const card = this.add.image(x, y, pokemon.id)
                .setDisplaySize(120, 180)
                .setInteractive();

            card.on("pointerdown", () => {
                this.selectPokemon(pokemon);
            });

            this.add.text(x, y + 100, pokemon.name, {
                font: "14px Arial",
                fill: "#ffffff",
                align: "center",
                wordWrap: { width: 140 }
            }).setOrigin(0.5, 0);

            x += cardWidth;
            count++;

            if (count % columns === 0) {
                x = startX;
                y += cardHeight;
            }
        }

        // Set world bounds for scrolling
        const totalRows = Math.ceil(POKEMON_SET.length / columns);
        const worldHeight = startY + (totalRows * cardHeight) + 100;
        this.cameras.main.setBounds(0, 0, this.scale.width, worldHeight);
        this.cameras.main.setScroll(0, 0);

        // Enable scrolling with mouse wheel
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            this.cameras.main.scrollY += deltaY * 0.5;
            this.cameras.main.scrollY = Phaser.Math.Clamp(
                this.cameras.main.scrollY,
                0,
                worldHeight - this.scale.height
            );
        });

        // Enable touch/drag scrolling for mobile
        let isDragging = false;
        let dragStartY = 0;
        let scrollStartY = 0;

        this.input.on('pointerdown', (pointer) => {
            isDragging = true;
            dragStartY = pointer.y;
            scrollStartY = this.cameras.main.scrollY;
        });

        this.input.on('pointermove', (pointer) => {
            if (isDragging) {
                const dragDistance = dragStartY - pointer.y;
                this.cameras.main.scrollY = scrollStartY + dragDistance;
                this.cameras.main.scrollY = Phaser.Math.Clamp(
                    this.cameras.main.scrollY,
                    0,
                    worldHeight - this.scale.height
                );
            }
        });

        this.input.on('pointerup', () => {
            isDragging = false;
        });
    }

    selectPokemon(pokemon) {
        // Store the player's choice
        this.registry.set("playerPokemon", pokemon);

        // Choose a random Pokémon for the AI
        const aiChoice = Phaser.Utils.Array.GetRandom(POKEMON_SET);
        this.registry.set("aiPokemon", aiChoice);

        this.scene.start("GameScene");
    }
}